# CertiChain - A Decentralized Document Verifier ⛓️

### "Where there is a chain there is Trust"

A full-stack decentralized application (dApp) that leverages the Ethereum blockchain to create a secure, tamper-proof system for uploading, verifying, and sharing credentials.

---

## 🚀 Live Demo & Preview

The live, deployed version of this dApp can be accessed here:

**➡️ [Launch CertiChain Live Demo](https://certichain-dapp.vercel.app)**

---

## ✨ Key Features

* **Secure Wallet Connection:** Users can securely "log in" and interact with the application using their MetaMask wallet.
* **Decentralized File Storage:** All documents are uploaded to **IPFS** via the Pinata service, ensuring files are stored permanently and not controlled by a single entity.
* **On-Chain Document Records:** A record of each document (its IPFS hash) is stored immutably on the blockchain via a custom **Solidity smart contract**.
* **Role-Based Access Control:**
    * **Owner:** The contract deployer has exclusive rights to add trusted issuers.
    * **Issuer:** An authorized address (e.g., a university) that can verify documents.
* **One-Click Verification:** Approved Issuers can verify credentials with a single, secure transaction.
* **Public Search:** A public-facing verifier page allows anyone (like a recruiter) to look up a user's wallet address and see their portfolio of verified documents.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, ethers.js, axios
* **Smart Contract:** Solidity
* **Blockchain:** Ethereum (Sepolia Testnet)
* **Decentralized Storage:** IPFS / Pinata
* **Development Environment:** Remix IDE, Node.js

---

## ⚙️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js installed
* MetaMask browser extension installed

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/YOUR_USERNAME/certichain-dapp.git](https://github.com/YOUR_USERNAME/certichain-dapp.git)
    ```
2.  **Navigate into the project directory:**
    ```sh
    cd certichain-dapp
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Set up your environment variables:**
    * Create a `.env` file in the root of the project.
    * Add your Pinata API keys to it:
        ```
        REACT_APP_PINATA_API_KEY="YOUR_PINATA_API_KEY"
        REACT_APP_PINATA_API_SECRET="YOUR_PINATA_API_SECRET"
        ```
5.  **Update the Smart Contract Address:**
    * Open `src/App.js`.
    * Replace the placeholder `contractAddress` with the address of your deployed smart contract on the Sepolia testnet.

6.  **Run the application:**
    ```sh
    npm start
    ```

---