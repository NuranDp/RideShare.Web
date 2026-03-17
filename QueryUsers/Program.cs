using Npgsql;

var connectionString = "Host=aws-1-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.xkagiljjwnmjitzzgika;Password=8HG6fa2rPC6V*$t;SSL Mode=Require;Trust Server Certificate=true";

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

Console.WriteLine("All Users in Database:");
Console.WriteLine("================================");

await using var cmd = new NpgsqlCommand("SELECT \"Email\", \"FullName\", \"Role\" FROM \"Users\" LIMIT 20", conn);
await using var reader = await cmd.ExecuteReaderAsync();

while (await reader.ReadAsync())
{
    Console.WriteLine($"Email: {reader.GetString(0)}, Name: {reader.GetString(1)}, Role: {reader.GetValue(2)}");
}

Console.WriteLine("\nNote: Passwords are hashed and cannot be retrieved. Default test password is usually the same format as Admin@123");
Console.WriteLine("Try: Passenger@123 or Test@123 or the email prefix + @123");
