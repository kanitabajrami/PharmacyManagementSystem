    using Microsoft.AspNetCore.Authentication.JwtBearer;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.IdentityModel.Tokens;
    using Microsoft.OpenApi.Models;
    using PharmacyManagmentSystem.Data;
    using PharmacyManagmentSystem.Helpers;
    using PharmacyManagmentSystem.Models;
    using PharmacyManagmentSystem.Repositories;
    using Microsoft.AspNetCore.HttpOverrides;

using PharmacyManagmentSystem.Services;
    using System.Text;

    namespace PharmacyManagmentSystem
    {
        public class Program
        {
            public static async Task Main(string[] args)
            {
                var builder = WebApplication.CreateBuilder(args);

                // -------------------- Services --------------------
                builder.Services.AddControllers();
                builder.Services.AddEndpointsApiExplorer();

                // ✅ Swagger (Swashbuckle) – use this, remove AddOpenApi/MapOpenApi to avoid conflicts
                builder.Services.AddSwaggerGen(c =>
                {
                    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Pharmacy API", Version = "v1" });

                    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                    {
                        Name = "Authorization",
                        Type = SecuritySchemeType.Http,
                        Scheme = "bearer",
                        BearerFormat = "JWT",
                        In = ParameterLocation.Header,
                        Description = "Enter: Bearer <your_token>"
                    });

                    c.AddSecurityRequirement(new OpenApiSecurityRequirement
                    {
                        {
                            new OpenApiSecurityScheme
                            {
                                Reference = new OpenApiReference
                                {
                                    Type = ReferenceType.SecurityScheme,
                                    Id = "Bearer"
                                }
                            },
                            Array.Empty<string>()
                        }
                    });
                });

                // ✅ Database (must exist in Azure as ConnectionStrings__DefaultConnection or Connection Strings: DefaultConnection)
                var cs = builder.Configuration.GetConnectionString("DefaultConnection");
                if (string.IsNullOrWhiteSpace(cs))
                    throw new Exception("Missing ConnectionStrings:DefaultConnection (set ConnectionStrings__DefaultConnection in Azure).");

                builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(cs));

                // ✅ Identity
                builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
                    .AddEntityFrameworkStores<ApplicationDbContext>()
                    .AddDefaultTokenProviders();

            var jwtIssuer = builder.Configuration["Jwt:Issuer"];
            var jwtAudience = builder.Configuration["Jwt:Audience"];
            var jwtKey = builder.Configuration["Jwt:Key"];

            if (string.IsNullOrWhiteSpace(jwtIssuer) ||
                string.IsNullOrWhiteSpace(jwtAudience) ||
                string.IsNullOrWhiteSpace(jwtKey))
            {
                throw new Exception("Missing JWT settings. Set Jwt__Issuer, Jwt__Audience, Jwt__Key in Azure App Settings.");
            }
            // ✅ Auth (JWT)
            builder.Services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtIssuer,
                        ValidAudience = jwtAudience,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtKey)
                        ),

                        ClockSkew = TimeSpan.Zero
                    };
                });

                builder.Services.AddAuthorization();

                // ✅ DI
                builder.Services.AddScoped<IMedicineRepository, MedicineRepository>();
                builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
                builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
                builder.Services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
                builder.Services.AddScoped<PrescriptionHelper>();

            // ✅ CORS – allow your local + Azure Static Web Apps frontend origin
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", policy =>
                    policy
                        .WithOrigins(
                            "https://pharmacy-management-system-liart.vercel.app",
                            "http://localhost:5173",
                            "http://localhost:3000"
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                );
            });




            var app = builder.Build();
                app.UseExceptionHandler(errorApp =>
                {
                    errorApp.Run(async context =>
                    {
                        context.Response.StatusCode = 500;
                        context.Response.ContentType = "text/plain";

                        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
                        if (feature?.Error != null)
                            await context.Response.WriteAsync(feature.Error.ToString());
                    });
                });


                // -------------------- Apply migrations on startup --------------------
                try
                {
                    using (var scope = app.Services.CreateScope())
                    {
                        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        await db.Database.MigrateAsync();
                    }

                    Console.WriteLine("✅ Database migrations applied successfully.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("❌ MIGRATION FAILED: " + ex);
                    // If you want the app to fail fast when DB is broken, uncomment:
                    // throw;
                }

                // -------------------- Seed (don’t crash app) --------------------
                static async Task SeedRolesAndAdminAsync(WebApplication app)
                {
                    using var scope = app.Services.CreateScope();
                    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                    string[] roles = { "Admin", "User" };

                    foreach (var r in roles)
                    {
                        if (!await roleManager.RoleExistsAsync(r))
                            await roleManager.CreateAsync(new IdentityRole(r));
                    }

                    var adminUserName = "blenda";
                    var user = await userManager.FindByNameAsync(adminUserName);

                    if (user != null && !await userManager.IsInRoleAsync(user, "Admin"))
                        await userManager.AddToRoleAsync(user, "Admin");
                }

                try
                {
                    await SeedRolesAndAdminAsync(app);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("❌ SEED FAILED: " + ex);
                }


            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });

            // -------------------- Middleware (ORDER MATTERS) --------------------
            app.UseHttpsRedirection();

                app.UseRouting();

                // ✅ CORS must be after routing and before auth
                app.UseCors("AllowReactApp");

              //  app.MapMethods("{*path}", new[] { "OPTIONS" }, () => Results.Ok())
              //.RequireCors("AllowReactApp");


                app.UseAuthentication();
                app.UseAuthorization();

                // ✅ Swagger (enable in Production too)
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pharmacy API v1");
                    c.RoutePrefix = "swagger";
                });

                // ✅ Simple root endpoint
                app.MapGet("/", () => "Pharmacy API is running");

            app.MapControllers().RequireCors("AllowReactApp");

            app.MapGet("/version", () => "cors-fix-3");

                app.Run();
            }
        }
    }
