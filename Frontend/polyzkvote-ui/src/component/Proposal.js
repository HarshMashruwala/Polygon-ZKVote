import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { create } from 'ipfs-http-client'
import MetaMaskOnboarding from '@metamask/onboarding';
import '../css/Proposal.css'
import Base from './Base'
import ViewProposal from './ViewProposal'
const projectId = process.env.REACT_APP_PROJECTID;
const projectSecret = process.env.REACT_APP_PROJECTSECRET;
const auth =
    'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
const ipfsClient = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
})
const ipfsBaseURL = 'https://polyzkvote.infura-ipfs.io/ipfs/'


function Proposal() {
    let { groupId,type } = useParams()
    const [userId, setUserId] = useState('')
    const [accounts, setAccounts] = useState('');
    const [proposalList, setProposalList] = useState([]);
    const [pageLoaded,setPageLoaded] = useState(true)

    useEffect(() => {
        function handleNewAccounts(newAccounts) {
            setAccounts(newAccounts);
        }
        async function onboarding(){
            if (MetaMaskOnboarding.isMetaMaskInstalled()) {
                await window.ethereum
                    .request({ method: 'eth_requestAccounts' })
                    .then(handleNewAccounts);
                await window.ethereum.on('accountsChanged', handleNewAccounts);
                return async () => {
                    await window.ethereum.off('accountsChanged', handleNewAccounts);
                };
            }
        }
        onboarding()
    }, []);


    useEffect(() => {
        // console.log(groupId)
        const _userId = localStorage.getItem('discordId')
        setUserId(_userId)
        const proposalModal = document.getElementById('proposalModal')
        proposalModal.addEventListener('show.bs.modal', event => {
            // Button that triggered the modal
            const button = event.relatedTarget
            // Extract info from data-bs-* attributes
            const proposalId = button.getAttribute('data-bs-whatever')
            // If necessary, you could initiate an AJAX request here
            // and then do the updating in a callback.
            //
            // Update the modal's content.
            const proposalName = document.getElementById('proposalName')
            // console.log(proposalName)
            const proposalOverview = proposalModal.querySelector('.proposalOverView')
            const proposalAsk = proposalModal.querySelector('.proposalAsk')
            const proposalUseCase = proposalModal.querySelector('.proposalUseCase')
            const proposalData = proposalList.filter(row => {
                return row.proposalId == proposalId
            })
            if(proposalData.length > 0) {
            proposalName.textContent = proposalData[0].name
            proposalOverview.textContent = proposalData[0].overview
            proposalAsk.textContent = proposalData[0].proposalAsk
            proposalUseCase.textContent = proposalData[0].proposalUseCase
            }
            

        })
    }, [proposalList])

    useEffect(()=>{
        if(accounts.length>0 && parseInt(type) === 1){
            const _userId = localStorage.getItem('discordId')
            setUserId(_userId)
            setPageLoaded(false)
            getAllProposal()
        }
        
    },[accounts])
    
    useEffect(()=>{
        if(parseInt(type) === 0){
            const _userId = localStorage.getItem('discordId')
            setUserId(_userId)
            setPageLoaded(false)
            getAllProposal()
        }
        
    },[])

    async function getAllProposal(){
        await fetch(`${process.env.REACT_APP_RELAYURL}getGroupProposal`,{
            method:"POST",
            headers: { 'Content-Type': 'application/json' },
            body:JSON.stringify({
                groupIdentity:groupId.toString()
            })
        }).then(result=>result.json()).then(response=>{
            // console.log(response)
            if(response.Proposal.length > 0){
                response.Proposal.forEach(async element => {
                    await fetch(`${process.env.REACT_APP_RELAYURL}getProposal`,{
                        method:"POST",
                        headers: { 'Content-Type': 'application/json' },
                        body:JSON.stringify({
                            groupIdentity:groupId.toString(),
                            proposalIdentity:element.toString()
                        })
                    }).then(result=>result.json()).then(async response=>{
                        // console.log(response)
                        await fetch(ipfsBaseURL+response.Proposal.CID).then(result=>result.json())
                        .then(metadata=>{
                            let proposalState
                            switch (response.Proposal.state) {
                                case 0:
                                    proposalState="Created"
                                    break;
                                case 1:
                                    proposalState="Ongoing"
                                    break;
                                case 2:
                                    proposalState="Ended"
                                    break;
                            
                                default:
                                    break;
                            } 
                            const proposal = {
                                name:metadata.name,
                                channelId:metadata.channelId,
                                overview:metadata.overview,
                                proposalId:metadata.proposalId,
                                proposalAsk:metadata.proposalAsk,
                                proposalUseCase:metadata.proposalUseCase,
                                status:proposalState,
                                startDate:metadata.startDate,
                                endDate:metadata.endDate,
                                type:parseInt(type),
                                DAOIdentity:groupId,
                                account:accounts[0],
                                userIdentity:localStorage.getItem('discordId'),
                                voterAddedStatus:response.Proposal.voterStatus
                            }
                            // console.log(proposal)
                            setProposalList(prevstate=>[
                                ...prevstate,
                                proposal
                            ])
                        })

                    }).catch(err=>{
                        console.log(err)
                    })
                })
            }
        }).catch(err=>{
            console.log(err)
        })
        setPageLoaded(true)
    }

    

    function RenderProposalCard() {
        return (proposalList.map((i, index) => {
            return (
                <ViewProposal
                    key={index}
                    name={i["name"]}
                    channelId={i["channelId"]}
                    overview={i["overview"]}
                    proposalId={i["proposalId"]}
                    status = {i["status"]}
                    startDate = {i["startDate"]}
                    endDate = {i["endDate"]}
                    type={i["type"]}
                    DAOIdentity={i["DAOIdentity"]}
                    account={i["account"]}
                    userIdentity={i["userIdentity"]}
                    voterAddedStatus={i["voterAddedStatus"]}

                />
            )
        }))
    }

    return (

        <Base>
            <div className="text-center">
            <span className="spinner-border spinner-border m-2" role="status" aria-hidden="true" hidden={pageLoaded} />
            </div>
            <h4 className="card-title p-2 flex-grow-1" hidden={!pageLoaded}>Proposal List</h4>
            <span className="text-danger" hidden={(accounts.length > 0) || (parseInt(type) === 0)}>Please Install Metamask</span>
            <RenderProposalCard />
            <div className="modal fade" id="proposalModal" tabIndex="-1" aria-labelledby="proposalModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="proposalName"></h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="mb-3">
                                <h5 className="modal-title" > Proposal Overview</h5>
                                <p className="card-text proposalOverView" id="proposalOverView">gefjghefiuoghfnbfiojbofibio</p>
                                </div>
                                <div className="mb-3">
                                <h5 className="modal-title" > Use Case</h5>
                                <p className="card-text proposalUseCase" id="proposalUseCase">gefjghefiuoghfnbfiojbofibio</p>
                                </div>
                                <div className="mb-3">
                                <h5 className="modal-title" >Proposal ask</h5>
                                <p className="card-text proposalAsk" id="proposalAsk">gefjghefiuoghfnbfiojbofibio</p>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </Base>
    )
}

export default Proposal
