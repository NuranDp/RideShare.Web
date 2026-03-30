import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable, filter, take } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  message: string;
  createdAt: string;
  isOwnMessage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RideChatService {
  private hubConnection: HubConnection | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private connectionStateSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private connectionReadySubject = new BehaviorSubject<boolean>(false);
  private initializationPromise: Promise<void> | null = null;
  private initializationInProgress = false;

  public messages$ = this.messagesSubject.asObservable();
  public isConnected$ = this.connectionStateSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public connectionReady$ = this.connectionReadySubject.asObservable();

  private currentRideId: string | null = null;

  constructor(private http: HttpClient) {}

  private getStoredToken(): string | null {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  private async ensureConnected(timeoutMs: number = 15000): Promise<void> {
    if (!this.hubConnection) {
      const token = this.getStoredToken();
      if (!token) {
        throw new Error('Auth token not found. Please log in again.');
      }

      await this.initializeConnection(token);
    }

    await this.waitForConnection(timeoutMs);

    if (!this.hubConnection) {
      throw new Error('Hub connection not initialized - hubConnection is null');
    }

    const connectionState = (this.hubConnection.state as any);
    if (connectionState !== 1 && connectionState !== 'Connected') {
      throw new Error(`SignalR not in Connected state: ${connectionState}`);
    }
  }

  /**
   * Initialize SignalR connection for chat
   */
  public initializeConnection(token: string): Promise<void> {
    // Return existing promise if already initializing
    if (this.initializationInProgress) {
      console.log('Initialization already in progress, returning existing promise');
      return this.initializationPromise || Promise.reject('Initialization in progress');
    }

    // Return existing successful promise
    if (this.connectionReadySubject.value && this.hubConnection) {
      console.log('Connection already initialized');
      return Promise.resolve();
    }

    console.log('Starting new SignalR connection initialization');
    this.initializationInProgress = true;

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        const url = `${environment.apiUrl.replace('/api', '')}/hubs/chat`;
        console.log('Connecting to hub at:', url);
        console.log('Token prefix:', token?.substring(0, 20) + '...');
        
        this.hubConnection = new HubConnectionBuilder()
          .withUrl(`${url}?access_token=${token}`, {
            withCredentials: true,
            skipNegotiation: true,
            transport: 1 // WebSockets only
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000])
          .configureLogging(LogLevel.Information)
          .build();

        console.log('HubConnection built, setting up listeners');
        this.setupHubListeners();

        console.log('Starting connection...');
        this.hubConnection.start()
          .then(() => {
            console.log('✅ Connection started successfully. State:', this.hubConnection?.state);
            this.initializationInProgress = false;
            this.connectionStateSubject.next(true);
            this.connectionReadySubject.next(true);
            this.errorSubject.next(null);
            resolve();
          })
          .catch(err => {
            console.error('❌ Connection failed:', err);
            this.initializationInProgress = false;
            this.initializationPromise = null; // Reset so it can retry
            this.errorSubject.next(`Connection failed: ${err.message}`);
            reject(err);
          });
      } catch (err) {
        console.error('❌ Connection initialization error:', err);
        this.initializationInProgress = false;
        this.initializationPromise = null; // Reset so it can retry
        this.errorSubject.next(`Initialization failed: ${err}`);
        reject(err);
      }
    });

    return this.initializationPromise;
  }

  /**
   * Wait for connection to be ready (with timeout)
   */
  public waitForConnection(timeoutMs: number = 15000): Promise<void> {
    if (this.connectionReadySubject.value) {
      console.log('Connection already ready');
      return Promise.resolve();
    }

    console.log('Waiting for connection to be ready...');
    
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        subscription.unsubscribe();
        console.error('Connection wait timeout');
        reject(new Error('Connection timeout - could not establish SignalR connection'));
      }, timeoutMs);

      const subscription = this.connectionReady$
        .pipe(
          filter(isReady => isReady),
          take(1)
        )
        .subscribe({
          next: () => {
            clearTimeout(timeoutHandle);
            console.log('Connection is ready!');
            subscription.unsubscribe();
            resolve();
          },
          error: (err) => {
            clearTimeout(timeoutHandle);
            console.error('Connection subscription error:', err);
            reject(err);
          }
        });
    });
  }

  /**
   * Setup listeners for SignalR hub events
   */
  private setupHubListeners(): void {
    if (!this.hubConnection) return;

    console.log('Setting up hub listeners');

    this.hubConnection.on('receiveMessage', (message: ChatMessage) => {
      console.log('Message received:', message);
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });

    this.hubConnection.on('userJoinedChat', (data: any) => {
      console.log(`User ${data?.userId} joined the chat for ride ${data?.rideId}`);
    });

    this.hubConnection.on('error', (error: string) => {
      console.error('Hub error:', error);
      this.errorSubject.next(error);
    });

    this.hubConnection.onreconnected(() => {
      console.log('Chat reconnected');
      this.connectionStateSubject.next(true);
      // Rejoin the ride chat if we have one
      if (this.currentRideId) {
        this.joinRideChat(this.currentRideId);
      }
    });

    this.hubConnection.onreconnecting(() => {
      console.log('Chat reconnecting...');
      this.connectionStateSubject.next(false);
    });

    this.hubConnection.onclose(() => {
      console.log('Chat connection closed');
      this.connectionStateSubject.next(false);
      this.connectionReadySubject.next(false);
    });
  }

  /**
   * Join a ride's chat group
   */
  public async joinRideChat(rideId: string): Promise<void> {
    try {
      await this.ensureConnected(15000);

      const connectionState = (this.hubConnection!.state as any);
      console.log('Hub connection state before join:', connectionState, '(expecting 1 or "Connected")');

      this.currentRideId = rideId;
      this.messagesSubject.next([]); // Clear previous messages

      // Load historical messages first
      try {
        const messages = await this.loadRideMessages(rideId).toPromise() || [];
        console.log('Loaded', messages.length, 'historical messages');
        this.messagesSubject.next(messages);
      } catch (err) {
        console.warn('Failed to load historical messages:', err);
        // Don't fail the whole operation if message history fails
      }

      // Join the SignalR group
      console.log('Invoking JoinRideChat for ride:', rideId);
      await this.hubConnection!.invoke('JoinRideChat', rideId);
      console.log('✅ Successfully joined ride chat:', rideId);
    } catch (err) {
      console.error('❌ Error joining ride chat:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.errorSubject.next(`Failed to join chat: ${errorMsg}`);
      throw err;
    }
  }

  /**
   * Leave a ride's chat group
   */
  public async leaveRideChat(rideId: string): Promise<void> {
    if (!this.hubConnection) return;

    try {
      await this.hubConnection.invoke('LeaveRideChat', rideId);
      this.currentRideId = null;
      this.messagesSubject.next([]);
    } catch (err) {
      console.error('Error leaving chat:', err);
    }
  }

  /**
   * Send a message to the ride chat
   */
  public async sendMessage(rideId: string, messageText: string): Promise<void> {
    await this.ensureConnected(15000);

    const connectionState = (this.hubConnection!.state as any);
    console.log('Sending message. Connection state:', connectionState);
    
    if (connectionState !== 1 && connectionState !== 'Connected') {
      throw new Error(`SignalR disconnected (state: ${connectionState}). Please try again.`);
    }

    if (!messageText || messageText.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (messageText.length > 200) {
      throw new Error('Message too long (max 200 characters)');
    }

    try {
      console.log('Invoking SendMessage for ride:', rideId);
      await this.hubConnection!.invoke('SendMessage', rideId, messageText.trim());
      console.log('Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.errorSubject.next(`Failed to send message: ${errorMsg}`);
      throw err;
    }
  }

  /**
   * Load historical messages for a ride (HTTP API)
   */
  public loadRideMessages(rideId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${environment.apiUrl}/rides/${rideId}/messages`);
  }

  /**
   * Stop the connection
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .catch(err => console.error('Error stopping connection:', err));
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionStateSubject.value;
  }

  /**
   * Get current messages
   */
  public getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }
}
