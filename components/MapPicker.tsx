'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { LeafletMouseEvent } from 'leaflet'

type Props = {
    onSelect: (lat: number, lng: number) => void
}

function LocationMarker({ onSelect }: Props) {
    const [position, setPosition] = useState<any>(null)

    useMapEvents({
        click(e: LeafletMouseEvent) {
            setPosition(e.latlng)
            onSelect(e.latlng.lat, e.latlng.lng)
        },
    })

    return position ? <Marker position={position} /> : null
}

export default function MapPicker({ onSelect }: Props) {
    return (
        <MapContainer
            center={[-7.98, 112.63]}
            zoom={13}
            className="h-64 w-full rounded"
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker onSelect={onSelect} />
        </MapContainer>
    )
}