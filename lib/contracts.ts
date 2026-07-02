import { sepolia } from 'wagmi/chains'

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!

export const SEPOLIA_ID = sepolia.id

export const FACTORY_ABI = [
    {
        "inputs": [{"internalType": "address","name": "_shariaBoard","type": "address"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "address","name": "registryAddress","type": "address"},
            {"indexed": true,"internalType": "address","name": "nazhir","type": "address"},
            {"indexed": false,"internalType": "uint256","name": "timestamp","type": "uint256"}
        ],
        "name": "RegistryCreated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "createRegistry",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllRegistries",
        "outputs": [{
            "components": [
                {"internalType": "address","name": "registryAddress","type": "address"},
                {"internalType": "address","name": "nazhir","type": "address"},
                {"internalType": "uint256","name": "createdAt","type": "uint256"}
            ],
            "internalType": "struct WaqfFactory.RegistryInfo[]",
            "name": "","type": "tuple[]"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address","name": "_nazhir","type": "address"}],
        "name": "getNazhirRegistries",
        "outputs": [{
            "components": [
                {"internalType": "address","name": "registryAddress","type": "address"},
                {"internalType": "address","name": "nazhir","type": "address"},
                {"internalType": "uint256","name": "createdAt","type": "uint256"}
            ],
            "internalType": "struct WaqfFactory.RegistryInfo[]",
            "name": "","type": "tuple[]"
        }],
        "stateMutability": "view",
        "type": "function"
    }
];

export const REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "address","name": "_nazhir","type": "address"},
            {"internalType": "address","name": "_shariaBoard","type": "address"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},
            {"indexed": true,"internalType": "address","name": "wakif","type": "address"},
            {"indexed": false,"internalType": "string","name": "name","type": "string"}
        ],
        "name": "AssetRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},
            {"indexed": true,"internalType": "address","name": "verifier","type": "address"}
        ],
        "name": "AssetApproved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},
            {"indexed": false,"internalType": "string","name": "activity","type": "string"}
        ],
        "name": "AssetManaged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true,"internalType": "uint256","name": "id","type": "uint256"},
            {"indexed": true,"internalType": "address","name": "to","type": "address"},
            {"indexed": false,"internalType": "string","name": "description","type": "string"}
        ],
        "name": "BenefitDistributed",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "string","name": "_name","type": "string"},
            {"internalType": "string","name": "_assetType","type": "string"},
            {"internalType": "string","name": "_location","type": "string"},
            {"internalType": "string","name": "_ipfsDocument","type": "string"}
        ],
        "name": "registerAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "_assetId","type": "uint256"}],
        "name": "approveAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256","name": "_assetId","type": "uint256"},
            {"internalType": "string","name": "_activity","type": "string"}
        ],
        "name": "recordActivity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256","name": "_assetId","type": "uint256"},
            {"internalType": "address","name": "_to","type": "address"},
            {"internalType": "string","name": "_description","type": "string"}
        ],
        "name": "distributeBenefit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "_assetId","type": "uint256"}],
        "name": "getAsset",
        "outputs": [{
            "components": [
                {"internalType": "uint256","name": "id","type": "uint256"},
                {"internalType": "string","name": "name","type": "string"},
                {"internalType": "string","name": "assetType","type": "string"},
                {"internalType": "string","name": "location","type": "string"},
                {"internalType": "string","name": "ipfsDocument","type": "string"},
                {"internalType": "address","name": "wakif","type": "address"},
                {"internalType": "address","name": "nazhir","type": "address"},
                {"internalType": "uint8","name": "status","type": "uint8"},
                {"internalType": "uint256","name": "registeredAt","type": "uint256"}
            ],
            "internalType": "struct IWaqfInterface.Asset",
            "name": "","type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "_assetId","type": "uint256"}],
        "name": "getActivities",
        "outputs": [{
            "components": [
                {"internalType": "string","name": "description","type": "string"},
                {"internalType": "uint256","name": "timestamp","type": "uint256"}
            ],
            "internalType": "struct WaqfAssetRegistry.ActivityRecord[]",
            "name": "","type": "tuple[]"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "_assetId","type": "uint256"}],
        "name": "getBenefits",
        "outputs": [{
            "components": [
                {"internalType": "address","name": "recipient","type": "address"},
                {"internalType": "string","name": "description","type": "string"},
                {"internalType": "uint256","name": "timestamp","type": "uint256"}
            ],
            "internalType": "struct WaqfAssetRegistry.BenefitRecord[]",
            "name": "","type": "tuple[]"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "assetCount",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nazhir",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "shariaBoard",
        "outputs": [{"internalType": "address","name": "","type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
];