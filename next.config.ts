import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SNAK_CONTRACT_ADDRESS: process.env.SNAK_CONTRACT_ADDRESS,
    SNEK_EGG_NFT_CONTRACT_ADDRESS: process.env.SNEK_EGG_NFT_CONTRACT_ADDRESS
  }
};

export default nextConfig;
