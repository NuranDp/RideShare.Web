import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RideChatService, ChatMessage } from '../../services/ride-chat.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ride-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ride-chat.component.html',
  styleUrls: ['./ride-chat.component.scss']
})
export class RideChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() rideId!: string;
  @Input() currentUserId: string | null = null;
  @Input() maxMessages: number = 0;
  
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessageText: string = '';
  isLoading = true;

  get displayedMessages(): ChatMessage[] {
    if (this.maxMessages > 0 && this.messages.length > this.maxMessages) {
      return this.messages.slice(-this.maxMessages);
    }
    return this.messages;
  }
  isSending = false;
  isConnected = false;
  error: string | null = null;
  shouldScroll = true;

  private destroy$ = new Subject<void>();

  constructor(private chatService: RideChatService) {}

  ngOnInit(): void {
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages.map(message => ({
          ...message,
          isOwnMessage: this.currentUserId ? message.senderId === this.currentUserId : !!message.isOwnMessage
        }));
        this.isLoading = false;
        this.shouldScroll = true;
      });

    this.chatService.isConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isConnected => {
        this.isConnected = isConnected;
      });

    this.chatService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        if (error && error.length > 0) {
          setTimeout(() => this.error = null, 5000);
        }
      });

    // Join the ride chat
    if (this.rideId) {
      this.chatService.joinRideChat(this.rideId)
        .catch(err => {
          this.error = `Failed to join chat: ${err.message}`;
          this.isLoading = false;
        });
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messagesContainer) {
      this.shouldScroll = false;
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessageText.trim() || this.isSending || this.isLoading) {
      return;
    }

    this.isSending = true;
    this.error = null;

    try {
      await this.chatService.sendMessage(this.rideId, this.newMessageText);
      this.newMessageText = '';
      // Scroll to show the sent message
      this.shouldScroll = true;
    } catch (err: any) {
      this.error = err.message || 'Failed to send message';
      console.error('Send message error:', err);
    } finally {
      this.isSending = false;
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getMessageTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  ngOnDestroy(): void {
    this.chatService.leaveRideChat(this.rideId);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
