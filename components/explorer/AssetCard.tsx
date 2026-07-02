'use client'

import Link from 'next/link'

export default function AssetCard({ asset }: any) {
    return (
        <div className="border rounded-lg p-4 space-y-2">

            <h2 className="font-semibold text-lg">
                {asset.name}
            </h2>

            <p className="text-sm text-gray-500">
                {asset.asset_type}
            </p>

            <p className="text-sm">
                {asset.location}
            </p>

            <Link href={`/explorer/${asset.id}`}>
                <button className="mt-2 w-full border rounded py-1">
                    View Transparency
                </button>
            </Link>

        </div>
    )
}