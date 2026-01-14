using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Tables
        public DbSet<User> Users { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Medicine> Medicines { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }

        // Join table (many-to-many)
        public DbSet<PrescriptionMedicine> PrescriptionMedicines { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

           
            // Supplier (1) -> (many) Medicines
            modelBuilder.Entity<Medicine>()
                .HasOne(m => m.Supplier)
                .WithMany(s => s.Medicines)
                .HasForeignKey(m => m.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

         
            // Invoice (1) -> (many) InvoiceItems
            modelBuilder.Entity<InvoiceItem>()
                .HasOne(i => i.Invoice)
                .WithMany(i => i.InvoiceItems)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);


            // Medicine (1) -> (many) InvoiceItems
            modelBuilder.Entity<InvoiceItem>()
                .HasOne(i => i.Medicine)
                .WithMany(m => m.InvoiceItems)
                .HasForeignKey(ii => ii.MedicineId)
                .OnDelete(DeleteBehavior.Restrict);

            // Invoice (many) -> (1) User
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.User)
                .WithMany() // or .WithMany(u => u.Invoices) if you add that collection in User
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Invoice (many) -> (0/1) Prescription (optional link)
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Prescription)
                .WithMany()
                .HasForeignKey(i => i.PrescriptionId)
                .OnDelete(DeleteBehavior.SetNull);


            // PrescriptionMedicine (join table)
            // Composite key: (PrescriptionId, MedicineId)
            modelBuilder.Entity<PrescriptionMedicine>()
                .HasKey(pm => new { pm.PrescriptionId, pm.MedicineId });

            modelBuilder.Entity<PrescriptionMedicine>()
                .HasOne(pm => pm.Prescription)
                .WithMany(p => p.PrescriptionMedicines)
                .HasForeignKey(pm => pm.PrescriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PrescriptionMedicine>()
                .HasOne(pm => pm.Medicine)
                .WithMany(m => m.PrescriptionMedicines)
                .HasForeignKey(pm => pm.MedicineId)
                .OnDelete(DeleteBehavior.Restrict);

            //Quantity must be > 0
            modelBuilder.Entity<PrescriptionMedicine>()
                .Property(pm => pm.Quantity)
                .IsRequired();
        }
    }
}
