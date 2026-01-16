using Microsoft.AspNetCore.Mvc;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Helpers;
using PharmacyManagmentSystem.Migrations;
using PharmacyManagmentSystem.Models;
using PharmacyManagmentSystem.Repositories;
using System.Net.WebSockets;

namespace PharmacyManagmentSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _repository;
        public UserController(IUserRepository repository)
        {
            _repository = repository;
        }

        // GET: api/User
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _repository.GetAllAsync();
            return Ok(users.Select(UserMapper.toDto));
        }

        // GET: api/User/id/{id}
        [HttpGet("id/{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _repository.GetByIdAsync(id);
            if (user == null) 
                return NotFound("User not found");

            return Ok(UserMapper.toDto(user));
        }

        // GET: api/User/username/{username}
        [HttpGet("username/{username}")]
        public async Task<IActionResult> GetByUsername (string username)
        {
            var user = await _repository.GetByUsernameAsync(username);
            if (user == null)
                return NotFound("User not found");
            return Ok(UserMapper.toDto(user));
        }

        // POST: api/User
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserCreateUpdateDto dto)
        {
            if (string.IsNullOrEmpty(dto.Password))
                return BadRequest("Password is required");
            if (await _repository.UsernameExistsAsync(dto.Username))
                return BadRequest("Username already exists");

            var user = UserMapper.toEntity(dto);
            await _repository.AddUser(user);
            return CreatedAtAction(nameof(GetById), new {id = user.Id}, UserMapper.toDto(user));
        }

        // PUT: api/User/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserCreateUpdateDto dto)
        {
            var user = await _repository.GetByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            UserMapper.UpdateUser(user, dto);
            await _repository.UpdateUser(user);

            return Ok(UserMapper.toDto(user));
        }

        // DELETE: api/User/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _repository.GetByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            await _repository.DeleteUser(id);
            return Ok(new { Message = "User deleted successfully" });
        }

        // PATCH: api/User/{id}/role
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] string newRole)
        {
            if (string.IsNullOrEmpty(newRole))
                return BadRequest("Role cannot be empty");

            var user = await _repository.GetByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            await _repository.UpdateRoleAsync(id, newRole);
            return Ok(new { Message = "Role updated successfully" });
        }

        // PATCH: api/User/{id}/password
        [HttpPatch("{id}/password")]
        public async Task<IActionResult> UpdatePassword(int id, [FromBody] string newPassword)
        {
            if (string.IsNullOrEmpty(newPassword))
                return BadRequest("Password cannot be empty");

            var user = await _repository.GetByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            var hashedPassword = UserMapper.HashPassword(newPassword);
            await _repository.UpdatePasswordHashAsync(id, hashedPassword);
            return Ok(new { Message = "Password updated successfully" });
        }
    }
}
