//.NET 8 MVC 
//Active Directory Federation Services (ADFS) setup


using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.WsFederation;
using Microsoft.AspNetCore.HttpOverrides;
using System.Security.Claims;

namespace YuskiTheDeveloper.Adfs
{
    public class Program
    {
        public const string POLICY_ADMIN = "policy_admin";
        public const string POLICY_GUEST = "policy_guest";

        private const string AD_ROLE_ADMIN = "awesome_site_admin";
        private const string AD_ROLE_GUEST = "awesome_site_guest";

        public static void Main(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var builder = WebApplication.CreateBuilder();

            builder.Services
                .AddControllersWithViews()
                .AddSessionStateTempDataProvider();

            builder.Services.AddHttpContextAccessor();

            builder.Services.AddAuthentication(o =>
            {
                o.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = WsFederationDefaults.AuthenticationScheme;
            })
            .AddWsFederation(o =>
            {
                o.Wtrealm = builder.Configuration["adfs:wtRealm"]; //#example "https://yoursite.com", an uri
                o.Wreply = builder.Configuration["adfs:wReply"]; //#example "https://yoursite.com/signin-wsfed", "/signin-wsfed" is the default
                o.MetadataAddress = builder.Configuration["adfs:metadataAddress"]; //#example "https://adfs.yourcompanyname.com/FederationMetadata.xml"				
            })
            .AddCookie();

            builder.Services.AddAuthorization(o =>
            {
                //map AD claims to site policies to keep everything in one place
                o.AddPolicy(POLICY_ADMIN, p => p.RequireClaim(ClaimTypes.Role, AD_ROLE_ADMIN));
                o.AddPolicy(POLICY_GUEST, p => p.RequireClaim(ClaimTypes.Role, AD_ROLE_GUEST));

                //#example: use in the controller like [Authorize(Policy = Program.POLICY_ADMIN)]
            });

            builder.Services.AddRazorPages();


            var app = builder.Build();

            //the next part resulted to be important for adfs
            var forwardingOptions = new ForwardedHeadersOptions()
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            };
            forwardingOptions.KnownNetworks.Clear();
            forwardingOptions.KnownProxies.Clear();
            app.UseForwardedHeaders(forwardingOptions);

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();
            app.UseStatusCodePages();

            app.UseAuthentication();
            app.UseAuthorization();

            //irrelevant stuff like app.MapControllerRoute not shown 

            app.Run();
        }
    }
}
