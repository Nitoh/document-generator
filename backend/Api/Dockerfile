FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/Api/DocumentGenerator.Api.csproj backend/Api/
RUN dotnet restore backend/Api/DocumentGenerator.Api.csproj
COPY backend/Api/ backend/Api/
RUN dotnet publish backend/Api/DocumentGenerator.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
COPY --chmod=755 backend/Api/start.sh /app/start.sh
ENV ASPNETCORE_HTTP_PORTS=8080
USER app
EXPOSE 8080
ENTRYPOINT ["/app/start.sh"]
