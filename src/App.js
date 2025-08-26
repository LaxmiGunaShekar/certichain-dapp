import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css';

const finalABI = [
  "function owner() view returns (address)", "function isIssuer(address) view returns (bool)", "function addIssuer(address _newIssuer)", "function addDocument(string memory _ipfsHash, string memory _documentName)", "function verifyDocument(address _userAddress, uint256 _docIndex)", "function getDocumentCount(address _user) view returns (uint256)", "function getDocument(address _user, uint256 _index) view returns (string, string, address, bool)"
];
const contractAddress = "0x81298d0A12addC1D3E873169284F54C6dbA1F460"; // Your working contract address

//============================================
// LANDING PAGE COMPONENT
//============================================
function LandingPage({ onLaunch }) {
  return (
    <div className="landing-page">
      <div className="hero-section">
        <h1>CertiChain</h1>
        <p className="quote">"Where there is a chain there is Trust"</p>
        <button className="launch-button" onClick={onLaunch}>Launch dApp</button>
      </div>
      <div className="info-section">
        <h2>Why CertiChain?</h2>
        <div className="features-grid">
          <div className="feature-card"><i className="fa-solid fa-cubes"></i><h3>Immutable & Tamper-Proof</h3><p>Leveraging blockchain technology, every credential is a permanent, unchangeable record, eliminating the possibility of fraud.</p></div>
          <div className="feature-card"><i className="fa-solid fa-cloud-arrow-up"></i><h3>Decentralized & Always Available</h3><p>Files are stored on the IPFS network, ensuring they are always accessible, censorship-resistant, and not controlled by any single entity.</p></div>
          <div className="feature-card"><i className="fa-solid fa-shield-halved"></i><h3>Instant & Trustworthy Verification</h3><p>Trusted institutions can verify credentials with a single, secure transaction, providing immediate and undeniable proof of authenticity for employers.</p></div>
        </div>
      </div>
      <div className="info-section">
        <h2>How It Works</h2>
        <div className="how-it-works-grid">
          <div className="step-card"><h3>1. Upload</h3><i className="fa-solid fa-arrow-up-from-bracket"></i><p>Connect your Web3 wallet and upload your credential. The file is secured on IPFS and a corresponding record is created on-chain.</p></div>
          <div className="step-card"><h3>2. Verify</h3><i className="fa-solid fa-check-to-slot"></i><p>The original issuing institution verifies the document, creating a permanent, trustworthy link on the blockchain.</p></div>
          <div className="step-card"><h3>3. Share</h3><i className="fa-solid fa-magnifying-glass"></i><p>Recruiters can instantly look up a user's wallet address and see a complete, trusted portfolio of their verified credentials.</p></div>
        </div>
      </div>
      <footer className="footer"><p>© 2025 CertiChain. A Decentralized Identity Project.</p></footer>
    </div>
  );
}

//============================================
// LOGIN PAGE COMPONENT
//============================================
function LoginPage({ onConnect }) {
  return (
    <div className="connect-wallet-container">
      <h3 className="dashboard-title">Welcome to CertiChain</h3>
      <p className="dashboard-description">Please select your role to connect. This is your secure entry point to the world of decentralized identity.</p>
      <div className="login-options">
        <button onClick={() => onConnect('user')}>Connect as User</button>
        <button onClick={() => onConnect('issuer')}>Connect as Issuer / Admin</button>
        <button onClick={() => onConnect('public')}>Launch Public Verifier</button>
      </div>
    </div>
  );
}

//============================================
// MAIN DAPP CONTAINER COMPONENT
//============================================
function MainDApp() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [view, setView] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAnIssuer, setIsAnIssuer] = useState(false);

  const connectWallet = async (role) => {
    if (window.ethereum) {
      try {
        const providerInstance = new ethers.BrowserProvider(window.ethereum);
        const signer = await providerInstance.getSigner();
        const userAccount = await signer.getAddress();
        const contractInstance = new ethers.Contract(contractAddress, finalABI, signer);
        
        const ownerAddress = await contractInstance.owner();
        const issuerStatus = await contractInstance.isIssuer(userAccount);

        if (role === 'issuer' && !issuerStatus && userAccount.toLowerCase() !== ownerAddress.toLowerCase()) {
          alert("Access Denied: Your address is not registered as an Issuer or Admin.");
          return;
        }

        setProvider(providerInstance);
        setAccount(userAccount);
        setContract(contractInstance);
        setIsOwner(userAccount.toLowerCase() === ownerAddress.toLowerCase());
        setIsAnIssuer(issuerStatus);
        setView(role);

      } catch (error) { console.error("Error connecting wallet:", error); }
    } else { alert("Please install MetaMask."); }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setProvider(null);
    setView(null);
    setBalance(null);
    setIsOwner(false);
    setIsAnIssuer(false);
    console.log("Disconnected from dApp. For a full logout, disconnect from MetaMask settings.");
  };
  
  useEffect(() => {
    const fetchBalance = async () => {
      if (account && provider) {
        const rawBalance = await provider.getBalance(account);
        const formattedBalance = ethers.formatEther(rawBalance);
        setBalance(Number(formattedBalance).toFixed(5));
      }
    };
    fetchBalance();
  }, [account, provider]);

  return (
    <div className="dapp-container">
      {!account ? (
        <LoginPage onConnect={connectWallet} />
      ) : (
        <>
          <nav className="navbar">
            {view === 'user' && <button className='active'>My Profile</button>}
            {view === 'issuer' && <button className='active'>Issuer Dashboard</button>}
            {view === 'public' && <button className='active'>Public Verifier</button>}
            <button onClick={disconnectWallet} className="disconnect-button">Disconnect</button>
          </nav>
          <div>
            <p>Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
            {view === 'user' && <UserDashboard contract={contract} account={account} balance={balance} />}
            {view === 'issuer' && <IssuerDashboard contract={contract} isOwner={isOwner} isAnIssuer={isAnIssuer} />}
            {view === 'public' && <PublicVerifier contract={contract} />}
          </div>
        </>
      )}
    </div>
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
        {!appLaunched ? (<LandingPage onLaunch={() => setAppLaunched(true)} />) : (<MainDApp />)}
      </header>
    </div>
  );
}

//============================================
// USER DASHBOARD COMPONENT
//============================================
function UserDashboard({ contract, account, balance }) {
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
      } catch (error) { console.error("Error fetching documents:", error); } finally { setIsLoading(false); }
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
    } catch (error) { console.error("Error during upload:", error); } finally { setIsLoading(false); setSelectedFile(null); setDocName(""); document.querySelector('input[type="file"]').value = ""; }
  };

  return (
    <div>
      <div className="profile-header">
        <h3 className="dashboard-title">My Profile</h3>
        {balance && <p className="balance-display">Balance: {balance} ETH</p>}
      </div>
      <p className="dashboard-description">Manage your on-chain portfolio. Upload new documents to create a secure, verifiable record of your achievements.</p>
      <form onSubmit={handleAddDocument}>
        <h4>Upload a New Document</h4>
        <div><input type="text" placeholder="Document Name (e.g., 'Bachelor's Degree')" value={docName} onChange={(e) => setDocName(e.target.value)} required /></div>
        <div><input type="file" onChange={handleFileChange} required /></div>
        <button type="submit" disabled={isLoading}>{isLoading ? "Processing..." : "Upload and Add Document"}</button>
      </form>
      <div className="document-list">
        <h4>Your On-Chain Documents</h4>
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
    } catch (error) { console.error("Error adding issuer:", error); alert("Failed to add issuer. Only the contract owner can perform this action."); }
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
    } catch (error) { console.error("Error fetching user documents:", error); } finally { setIsLoading(false); }
  };

  const handleVerifyDocument = async (userAddress, docIndex) => {
    try {
      const tx = await contract.verifyDocument(userAddress, docIndex);
      await tx.wait();
      alert(`Document ${docIndex} verified successfully!`);
      handleSearchUser({ preventDefault: () => {} });
    } catch (error) { console.error("Error verifying document:", error); alert("Failed to verify document. Are you an authorized issuer?"); }
  };

  return (
    <div>
      {isOwner ? (
        <div className="admin-section">
          <h3 className="dashboard-title">Admin Panel</h3>
          <p className="dashboard-description">As the platform owner, you can grant verification rights to trusted institutions by adding their wallet address below.</p>
          <form onSubmit={handleAddIssuer}><input type="text" placeholder="New Issuer Address" value={newIssuerAddress} onChange={(e) => setNewIssuerAddress(e.target.value)} required /><button type="submit">Add Issuer</button></form>
        </div>
      ) : isAnIssuer ? (
        <div className="issuer-section">
          <h3 className="dashboard-title">Issuer Dashboard</h3>
          <p className="dashboard-description">As a trusted issuer, enter a user's wallet address to see a list of their credentials that are pending your verification.</p>
          <form onSubmit={handleSearchUser}><input type="text" placeholder="Student Wallet Address" value={userToVerify} onChange={(e) => setUserToVerify(e.target.value)} required /><button type="submit">Search</button></form><div className="document-list">{isLoading && <p>Searching...</p>}{!isLoading && hasSearched && userDocsToVerify.length > 0 && (userDocsToVerify.map(doc => (<div key={doc.index} className="document-item"><p><strong>Name:</strong> {doc.documentName}</p><p><strong>Status:</strong> ⏳ Pending</p><a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`} target="_blank" rel="noopener noreferrer">View Document</a><button onClick={() => handleVerifyDocument(userToVerify, doc.index)}>Verify</button></div>)))}{!isLoading && hasSearched && userDocsToVerify.length === 0 && (<p>No unverified documents to display for this user.</p>)}</div>
        </div>
      ) : (
        <p>You do not have permission to view this page.</p>
      )}
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
    } catch (error) { console.error("Error fetching user documents for public view:", error); setSearchedDocs([]); } finally { setIsLoading(false); }
  };

  return (
    <div className="public-verifier-section">
      <h3>Public Document Verifier</h3>
      <p className="dashboard-description">Anyone can use this tool to verify the authenticity of a user's credentials. Simply enter the user's public wallet address to view their on-chain portfolio.</p>
      <form onSubmit={handlePublicSearch}>
        <input type="text" placeholder="Enter Wallet Address" value={userToSearch} onChange={(e) => setUserToSearch(e.target.value)} required />
        <button type="submit">Search</button>
      </form>
      <div className="document-list">
        {isLoading && <p>Searching...</p>}
        {!isLoading && searchedDocs.length > 0 ? (
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