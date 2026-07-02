export default function RecentAssets({ assets }: { assets: any[] }) {
    return (
        <div className="bg-white rounded-xl p-4 border shadow-sm">
            <h3 className="font-semibold mb-4">Recent Waqf Assets</h3>

            {assets.length === 0 && (
                <p className="text-sm text-gray-500">No data</p>
            )}

            {assets.map((a) => (
                <div
                    key={a.id}
                    className="flex justify-between items-center border-b py-2"
                >
                    <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.asset_type}</p>
                    </div>

                    <span
                        className={`text-xs px-2 py-1 rounded ${
                            a.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
            {a.status}
          </span>
                </div>
            ))}
        </div>
    )
}