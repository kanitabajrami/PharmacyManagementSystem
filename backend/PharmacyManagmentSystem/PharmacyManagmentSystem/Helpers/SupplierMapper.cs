using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;
using System.Numerics;
using System.Xml.Linq;

namespace PharmacyManagmentSystem.Helpers
{
    public class SupplierMapper
    {
        public static Supplier ToEntity(SupplierDto dto) => new Supplier
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email
        };

        public static SupplierResponseDto ToResponseDto(Supplier s) => new SupplierResponseDto
        {
            Id=s.Id,
            Name = s.Name,
            Phone = s.Phone,
            Email = s.Email,
            IsActive = s.IsActive,
            MedicinesCount = s.Medicines?.Count ?? 0
        };
        public static void UpdateEntity(Supplier entity, SupplierDto dto)
        {
            entity.Name = dto.Name;
            entity.Phone = dto.Phone;
            entity.Email = dto.Email;
        }

}
}
