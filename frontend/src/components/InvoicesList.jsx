export default function InvoicesList({ invoices, showUserId }) {
  return (
    <div className="space-y-3">
      {invoices.map((inv) => (
        <div key={inv.id} className="p-4 bg-white rounded-xl border">
          <div className="flex justify-between">
            <div className="font-semibold">Invoice #{inv.id}</div>
            <div className="text-sm text-gray-500">
              {new Date(inv.dateCreated).toLocaleString()}
            </div>
          </div>

          <div className="text-sm mt-2">
            Customer: <span className="font-medium">{inv.customerName}</span>
          </div>

          {showUserId && (
            <div className="text-sm">
              UserId: <span className="font-mono text-xs">{inv.userId}</span>
            </div>
          )}

          <div className="text-sm mt-1">
            Total: <span className="font-semibold">{inv.totalAmount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
