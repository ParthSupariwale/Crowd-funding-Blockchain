import React, { useContext, createContext } from 'react';
import { createWallet, injectedProvider } from "thirdweb/wallets";
import { useAddress, useContract, ConnectWallet, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { defineChain } from "thirdweb/chains";
import { createThirdwebClient, getContract } from 'thirdweb';

const StateContext = createContext();
const client=createThirdwebClient({clientId:"07baf930ed674143787a0996a7bd15d7", secretKey:"5eZv9eF-9imb8mX_mxUkp4bfiqZJiRCtGp3WuLRvm79H2yj20zdgBhHQR1KZuHRSltLaBtl-3P4ZrNDVVoI45g"})
// const connect = (
//   <button
//     onClick={() =>
//       connect(async () => {
//         const metamask = createWallet("io.metamask"); // pass the wallet id
//         console.log("Trying to connect")
//         // if user has metamask installed, connect to it
//         if (injectedProvider("io.metamask")) {
//           await metamask.connect({ client });
//         }

//         // open wallet connect modal so user can scan the QR code and connect
//         else {
//           await metamask.connect({
//             client,
//             walletConnect: { showQrModal: true },
//           });
//         }

//         // return the wallet
//         return metamask;
//       })
//     }
//   >
//     Connect
//   </button>
// )

export const StateContextProvider = ({ children }) => {
  //const client=createThirdwebClient({clientId:"07baf930ed674143787a0996a7bd15d7", secretKey:"5eZv9eF-9imb8mX_mxUkp4bfiqZJiRCtGp3WuLRvm79H2yj20zdgBhHQR1KZuHRSltLaBtl-3P4ZrNDVVoI45g"})
  //const  mycontract  = getContract({client,chain: defineChain(11155111), address: '0x2337Be73727a36fF9fd4E8a7F725E14cAd3B6120'})
  //console.log(mycontract)
  const { contract } = useContract('0x677b14639105Dbaf65D40a617597D5c9b12E9453');
  console.log(contract)
  const { mutateAsync: createCampaign ,isLoading, error} = useContractWrite(contract, 'createCampaign');
  const address = "0x677b14639105Dbaf65D40a617597D5c9b12E9453"

  const connectWallet = async () => {
    try {
      const metamask = createWallet("io.metamask"); // pass the wallet id

      // if user has Metamask installed, connect to it
      if (injectedProvider("io.metamask")) {
        await metamask.connect({ client });
      }
      // open WalletConnect modal so user can scan the QR code and connect
      else {
        await metamask.connect({
          client,
          walletConnect: { showQrModal: true },
        });
      }

      // return the wallet
      return metamask;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      // handle error (e.g., show error message)
    }
  }


  const publishCampaign = async (form) => {
    try {
      if (!contract) {
        throw new Error("Contract object is undefined");
      }
  
      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // description
          form.target,
          new Date(form.deadline).getTime(), // deadline,
          form.image,
        ],
      });
  
      console.log("contract call success", data);
    } catch (error) {
      console.error("Contract call failure:", error);
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));

    return parsedCampaings;
  }

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

    return filteredCampaigns;
  }

  const donate = async (pId, amount) => {
    const data = await contract.call('donateToCampaign', [pId], { value: ethers.utils.parseEther(amount)});

    return data;
  }

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', [pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for(let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      })
    }

    return parsedDonations;
  }


  return (
    <StateContext.Provider
      value={{ 
        address,
        contract,
        connectWallet,
        createCampaign: publishCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => useContext(StateContext);