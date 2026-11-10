using Npgsql;

namespace DocumentGenerator.Api.Data;

internal static class PostgresConnection
{
    public static string? Normalize(string? value)
    {
        if (value is null ||
            (!value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) &&
             !value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)))
            return value;

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || string.IsNullOrWhiteSpace(uri.Host))
            throw new InvalidOperationException("The PostgreSQL connection URI is invalid.");

        var credentials = uri.UserInfo.Split(':', 2);
        var database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
        if (credentials.Length != 2 || credentials.Any(string.IsNullOrWhiteSpace) || string.IsNullOrWhiteSpace(database))
            throw new InvalidOperationException("The PostgreSQL connection URI needs a user, password and database.");

        return new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = database,
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = Uri.UnescapeDataString(credentials[1]),
            SslMode = SslMode.VerifyFull
        }.ConnectionString;
    }
}
