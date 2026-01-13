using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Helpers
{
    public class MedicineMapper
    {
        //this is used for GET
        public static MedicineResponseDto ToResponseDto(Medicine m) => new MedicineResponseDto()
        {
            Id = m.Id,
            Name=m.Name,
            Category = m.Category,
            Price = m.Price,
            Quantity = m.Quantity,
            BatchNumber=m.BatchNumber,
            ExpiryDate=m.ExpiryDate,
            SupplierId = m.SupplierId,
            SupplierName = m.Supplier?.Name ?? ""
        };

        //this is used for POST
        public static Medicine ToEntity(MedicineDto dto) => new Medicine()
        {
            Name = dto.Name,
            Category = dto.Category,
            Price = dto.Price,
            Quantity = dto.Quantity,
            BatchNumber=dto.BatchNumber,
            ExpiryDate=dto.ExpiryDate,
            SupplierId = dto.SupplierId
        };

        //this is used for PUT updates the existing entity
        public static void UpdateEntity(Medicine entity, MedicineDto dto)
        {
            entity.Name = dto.Name;
            entity.Category = dto.Category; 
            entity.Price = dto.Price;
            entity.Quantity = dto.Quantity;
            entity.BatchNumber = dto.BatchNumber;
            entity.ExpiryDate = dto.ExpiryDate;
            entity.SupplierId = dto.SupplierId;
        }
        
    }
}
