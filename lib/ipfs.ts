export const uploadToIPFS = async (file: File) => {
    try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY!,
                pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!,
            },
            body: formData,
        })

        if (!res.ok) {
            const text = await res.text()
            console.error("PINATA ERROR:", text)
            throw new Error("Upload gagal ke IPFS")
        }

        const data = await res.json()

        console.log("IPFS RESULT:", data)

        return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`

    } catch (err) {
        console.error("IPFS UPLOAD ERROR:", err)
        throw err
    }
}