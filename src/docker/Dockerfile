# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Api/ ./Api/
WORKDIR /src/Api/Api
RUN dotnet publish Api.csproj -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update \
	&& apt-get install -y --no-install-recommends libgssapi-krb5-2 \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/out ./
ENTRYPOINT ["dotnet", "Api.dll"]
