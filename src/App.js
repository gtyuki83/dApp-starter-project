import React, { useEffect, useState } from "react";
import './App.css';
import { ethers } from "ethers";
// ABIのインポート
import abi from "./utils/WavePortal.json";
const App = () => {
  // ユーザーのウォレット保存用状態変数
  const [currentAccount, setCurrentAccount] = useState("");

  // メッセージ保存用状態変数
  const [messageValue, setMessageValue] = useState("")

  // waves保存用状態変数
  const [allWaves, setAllWaves] = useState([]);
  console.log("currentAccount: ", currentAccount);

  // コントラクトアドレス保存用
  const contractAddress = "0x79B9CFeddd0B11F05E3CA2485218fD50f8Ea1444"

  // ABIの参照
  const ContractABI = abi.abi;

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, ContractABI, signer);
        const waves = await wavePortalContract.getAllWaves();
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, ContractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  console.log("currentAccount: ", currentAccount);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the ethreum object", ethereum);
      }
      // サイトにきたユーザーのアカウントを格納できる（複数格納可能のためaccountsと表記）
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected: ", accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, ContractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        // 最終追記分
        let contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          "Contract balance:",
          ethers.utils.formatEther(contractBalance)
        );

        // 追記分
        const waveTxn = await wavePortalContract.wave(messageValue, { gasLimit: 300000 })
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        // 追記分終わり

        // 最終追記分
        let contractBalance_post = await provider.getBalance(wavePortalContract.address);
        /* 契約の残高が減っていることを確認 */
        if (contractBalance_post < contractBalance) {
          /* 減っていたら下記を出力 */
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        console.log(
          "Contract balance after wave:",
          ethers.utils.formatEther(contractBalance_post)
        );

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>
        <div className="bio">
          イーサリアムウォレットを接続して、メッセージを作成したら、<span role="img" aria-label="hand-wave">👋</span>を送ってください<span role="img" aria-label="shine">✨</span>
        </div>
        <br />
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Wallet Connected
          </button>
        )}

        {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>)}
        {currentAccount && (<textarea name="messageArea"
          placeholder="メッセージはこちら"
          type="text"
          id="message"
          value={messageValue}
          onChange={e => setMessageValue(e.target.value)} />)
        }

        {currentAccount && (
          allWaves.slice(0).reverse().map((wave, index) => {
            return (
              <div key={index} style={{ backgroundColor: "#F8F8FF", marginTop: "16px", padding: "8px" }}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>)
          })
        )}
      </div>
    </div>
  );
}
export default App
