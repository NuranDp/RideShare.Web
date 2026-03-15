# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["RideShare.Api/RideShare.Api.csproj", "RideShare.Api/"]
COPY ["RideShare.Core/RideShare.Core.csproj", "RideShare.Core/"]
RUN dotnet restore "RideShare.Api/RideShare.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/RideShare.Api"
RUN dotnet build "RideShare.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "RideShare.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080

# Copy published app
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "RideShare.Api.dll"]
