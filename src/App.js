import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

// --- Hardcoded Final ABI ---
const finalABI = [
  "function owner() view returns (address)", "function isIssuer(address) view returns (bool)", "function addIssuer(address _newIssuer)", "function addDocument(string memory _ipfsHash, string memory _documentName)", "function verifyDocument(address _userAddress, uint256 _docIndex)", "function getDocumentCount(address _user) view returns (uint256)", "function getDocument(address _user, uint256 _index) view returns (string, string, address, bool)"
];
// --- End Hardcoded ABI ---

const contractAddress = "0x81298d0A12addC1D3E873169284F54C6dbA1F460";


//============================================
// LANDING PAGE COMPONENT
//============================================
function LandingPage({ onLaunch }) {
  return (
    <div className="landing-page">
      <h1>CertiChain</h1>
      <p>"Where there is a chain there is Trust"</p>
      <button className="launch-button" onClick={onLaunch}>Launch App</button>
      <footer className="footer">
        <p>© 2025 CertiChain. A Decentralized Identity Project.</p>
      </footer>
    </div>
  );
}


//============================================
// MAIN DAPP CONTAINER COMPONENT
//============================================
function MainDApp() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [view, setView] = useState('user');
  const [isOwner, setIsOwner] = useState(false);
  const [isAnIssuer, setIsAnIssuer] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAccount = await signer.getAddress();
        const contractInstance = new ethers.Contract(contractAddress, finalABI, signer);
        setAccount(userAccount);
        setContract(contractInstance);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask.");
    }
  };

  useEffect(() => {
    const checkRoles = async () => {
      if (contract && account) {
        try {
          const ownerAddress = await contract.owner();
          setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
          const issuerStatus = await contract.isIssuer(account);
          setIsAnIssuer(issuerStatus);
        } catch (error) { console.error("Error checking roles:", error); }
      }
    };
    checkRoles();
  }, [account, contract]);

  return (
    <>
      <nav className="navbar">
        <button onClick={() => setView('user')}>My Profile</button>
        <button onClick={() => setView('issuer')}>Issuer Dashboard</button>
        <button onClick={() => setView('public')}>Public Verifier</button>
      </nav>
      
      {!account ? (
        <button onClick={connectWallet} style={{maxWidth: '300px', margin: 'auto'}}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
          {view === 'user' && <UserDashboard contract={contract} account={account} />}
          {view === 'issuer' && <IssuerDashboard contract={contract} isOwner={isOwner} isAnIssuer={isAnIssuer} />}
          {view === 'public' && <PublicVerifier contract={contract} />}
        </div>
      )}
    </>
  );
}


//============================================
// APP WRAPPER COMPONENT
//============================================
function App() {
  const [appLaunched, setAppLaunched] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        {!appLaunched ? (
          <LandingPage onLaunch={() => setAppLaunched(true)} />
        ) : (
          <MainDApp />
        )}
      </header>
    </div>
  );
}


//============================================
// USER DASHBOARD COMPONENT
//============================================
function UserDashboard({ contract, account }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docName, setDocName] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (contract && account) {
      setIsLoading(true);
      try {
        const count = await contract.getDocumentCount(account);
        let docs = [];
        for (let i = 0; i < count; i++) {
          const docData = await contract.getDocument(account, i);
          docs.push({ ipfsHash: docData[0], documentName: docData[1], issuer: docData[2], isVerified: docData[3] });
        }
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [contract, account]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  const handleFileChange = (event) => setSelectedFile(event.target.files[0]);
  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile || !docName) return alert("Please select a file and enter a name.");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, { headers: { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}`, 'pinata_api_key': process.env.REACT_APP_PINATA_API_KEY, 'pinata_secret_api_key': process.env.REACT_APP_PINATA_API_SECRET } });
      const ipfsHash = res.data.IpfsHash;
      const tx = await contract.addDocument(ipfsHash, docName);
      await tx.wait();
      alert("Document added successfully!");
      fetchDocuments();
    } catch (error) {
      console.error("Error during upload:", error);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      setDocName("");
      document.querySelector('input[type="file"]').value = "";
    }
  };

  return (
    <div>
      <form onSubmit={handleAddDocument}>
        <h3>Upload a New Document</h3>
        <div><input type="text" placeholder="Document Name" value={docName} onChange={(e) => setDocName(e.target.value)} required /></div>
        <div><input type="file" onChange={handleFileChange} required /></div>
        <button type="submit" disabled={isLoading}>{isLoading ? "Processing..." : "Upload and Add Document"}</button>
      </form>
      <div className="document-list">
        <h3>Your Documents</h3>
        {isLoading && <p>Loading...</p>}
        {!isLoading && documents.length > 0 ? (
          documents.map((doc, index) => (
            <div key={index} className="document-item"><p><strong>Name:</strong> {doc.documentName}</p><p><strong>Status:</strong> {doc.isVerified ? `✅ Verified by ${doc.issuer.substring(0, 6)}...` : "⏳ Pending"}</p><a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">View Document</a></div>
          ))
        ) : (!isLoading && <p>You have no documents uploaded.</p>)}
      </div>
    </div>
  );
}

//============================================
// ISSUER DASHBOARD COMPONENT
//============================================
function IssuerDashboard({ contract, isOwner, isAnIssuer }) {
  const [newIssuerAddress, setNewIssuerAddress] = useState("");
  const [userToVerify, setUserToVerify] = useState("");
  const [userDocsToVerify, setUserDocsToVerify] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAddIssuer = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(newIssuerAddress)) return alert("Invalid Ethereum address.");
    try {
      const tx = await contract.addIssuer(newIssuerAddress);
      await tx.wait();
      alert("Issuer added successfully!");
      setNewIssuerAddress("");
    } catch (error) {
      console.error("Error adding issuer:", error);
      alert("Failed to add issuer. Only the contract owner can perform this action.");
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(userToVerify)) return alert("Invalid Ethereum address.");
    setIsLoading(true);
    setHasSearched(true);
    try {
      const count = await contract.getDocumentCount(userToVerify);
      let allDocs = [];
      for (let i = 0; i < count; i++) {
        const docData = await contract.getDocument(userToVerify, i);
        allDocs.push({ index: i, ipfsHash: docData[0], documentName: docData[1], issuer: docData[2], isVerified: docData[3] });
      }
      const unverifiedDocs = allDocs.filter(doc => !doc.isVerified);
      setUserDocsToVerify(unverifiedDocs);
    } catch (error) {
      console.error("Error fetching user documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDocument = async (userAddress, docIndex) => {
    try {
      const tx = await contract.verifyDocument(userAddress, docIndex);
      await tx.wait();
      alert(`Document ${docIndex} verified successfully!`);
      handleSearchUser({ preventDefault: () => {} });
    } catch (error) {
      console.error("Error verifying document:", error);
      alert("Failed to verify document. Are you an authorized issuer?");
    }
  };

  return (
    <div>
      {isOwner && (
        <div className="admin-section">
          <h3>Admin: Add New Issuer</h3>
          <form onSubmit={handleAddIssuer}><input type="text" placeholder="New Issuer Address" value={newIssuerAddress} onChange={(e) => setNewIssuerAddress(e.target.value)} required /><button type="submit">Add Issuer</button></form>
        </div>
      )}
      {isAnIssuer && (
        <div className="issuer-section">
          <h3>Verify Student Documents</h3>
          <form onSubmit={handleSearchUser}><input type="text" placeholder="Student Wallet Address" value={userToVerify} onChange={(e) => setUserToVerify(e.target.value)} required /><button type="submit">Search</button></form>
          <div className="document-list">
            {isLoading && <p>Searching...</p>}
            {!isLoading && hasSearched && userDocsToVerify.length > 0 && (
              userDocsToVerify.map(doc => (
                <div key={doc.index} className="document-item">
                  <p><strong>Name:</strong> {doc.documentName}</p><p><strong>Status:</strong> ⏳ Pending</p><a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">View Document</a>
                  <button onClick={() => handleVerifyDocument(userToVerify, doc.index)}>Verify</button>
                </div>
              ))
            )}
            {!isLoading && hasSearched && userDocsToVerify.length === 0 && (<p>No unverified documents to display for this user.</p>)}
          </div>
        </div>
      )}
      {!isOwner && !isAnIssuer && <p>You do not have permission to view this page.</p>}
    </div>
  );
}

//============================================
// PUBLIC VERIFIER COMPONENT
//============================================
function PublicVerifier({ contract }) {
  const [userToSearch, setUserToSearch] = useState("");
  const [searchedDocs, setSearchedDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handlePublicSearch = async (e) => {
    e.preventDefault();
    if (!ethers.isAddress(userToSearch)) return alert("Invalid Ethereum address.");
    setIsLoading(true);
    setHasSearched(true);
    try {
      const count = await contract.getDocumentCount(userToSearch);
      let docs = [];
      for (let i = 0; i < count; i++) {
        const docData = await contract.getDocument(userToSearch, i);
        docs.push({ ipfsHash: docData[0], documentName: docData[1], issuer: docData[2], isVerified: docData[3] });
      }
      setSearchedDocs(docs);
    } catch (error) {
      console.error("Error fetching user documents for public view:", error);
      setSearchedDocs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="public-verifier-section">
      <h3>Public Document Verifier</h3>
      <p>Enter a user's wallet address to see their credentials.</p>
      <form onSubmit={handlePublicSearch}>
        <input type="text" placeholder="Enter Wallet Address" value={userToSearch} onChange={(e) => setUserToSearch(e.target.value)} required />
        <button type="submit">Search</button>
      </form>
      <div className="document-list">
        {isLoading && <p>Searching...</p>}
        {!isLoading && hasSearched && searchedDocs.length > 0 ? (
          searchedDocs.map((doc, index) => (
            <div key={index} className="document-item">
              <p><strong>Name:</strong> {doc.documentName}</p>
              <p><strong>Status:</strong> {doc.isVerified ? `✅ Verified by ${doc.issuer.substring(0, 6)}...` : "❌ Not Verified"}</p>
              {doc.isVerified && <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">View Verified Document</a>}
            </div>
          ))
        ) : (!isLoading && hasSearched && <p>No documents found for this address.</p>)}
      </div>
    </div>
  );
}

export default App;