using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RolesController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public RolesController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // POST: api/roles/add
        [HttpPost("add")]
        public async Task<IActionResult> AddRole(string userName, string role)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user == null) return NotFound("User not found.");

            if (!await _roleManager.RoleExistsAsync(role))
                await _roleManager.CreateAsync(new IdentityRole(role));

            var result = await _userManager.AddToRoleAsync(user, role);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            return Ok(new { message = $"Added '{role}' to '{userName}'" });
        }

        // POST: api/roles/remove
        [HttpPost("remove")]
        public async Task<IActionResult> RemoveRole(string userName, string role)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user == null) return NotFound("User not found.");

            var result = await _userManager.RemoveFromRoleAsync(user, role);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            return Ok(new { message = $"Removed '{role}' from '{userName}'" });
        }
    }
}
