import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { create } from 'ipfs-http-client'
import PolyZKVote from '../script/PolyZKVote'
import {utils} from 'ethers'
import '../css/CreateProposal.css'
import MetaMaskOnboarding from '@metamask/onboarding';
import Base from './Base'
import web3 from '../script/web3_'
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
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

function CreateProposal() {
    let { groupId } = useParams()
    const [userId, setUserId] = useState('')
    const [accounts, setAccounts] = useState('');
    const [proposalName,setProposalName] = useState('')
    const [proposalOverview,setProposalOverview] = useState('')
    const [proposalUsecase,setProposalUsecase] = useState('')
    const [proposalAsk,setProposalAsk] = useState('')
    const [pollStartDate,setPollStartDate] = useState('')
    const [pollEndDate,setPollEndDate] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [registerStatus, setRegisterStatus] = useState(false)

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
        // console.log('test')
        // console.log(MetaMaskOnboarding.isMetaMaskInstalled())
        // console.log(groupId)
        const _userId = localStorage.getItem('discordId')
        setUserId(_userId)
    }, []);
// { name: "PolyVote", channelId: "123456789", overview: "sdgcgsgbiu asdgviush uiadhfiu", proposalId: "1",proposalAsk:"bcjkboidfbkdfboi",proposalUseCase:"afewygfugiugheugo",status:"OnGoing",startDate:"27/07/2022",endDate:"30/07/2022" }
    async function uploadData() {
        const _proposalMessage = web3.utils.soliditySha3(proposalName, groupId)
        const _proposalIdentity = new Identity(_proposalMessage)
        const proposalIdentity = _proposalIdentity.generateCommitment()

        try {
            const metaDataPath = await ipfsClient.add(JSON.stringify({
                name: proposalName,
                DAOidentity: groupId,
                overview: proposalOverview,
                proposalId: proposalIdentity.toString(),
                proposalAsk: proposalAsk,
                proposalUseCase: proposalUsecase,
                startDate:pollStartDate,
                endDate:pollEndDate
            }))
            // console.log(metaDataPath)
            await ipfsClient.pin.add(metaDataPath.path.toString())
            return metaDataPath.path.toString()

        } catch (err) {
            // console.log(err)
            setErrorMessage("Opps! Somthing went wrong.")
            return 'error'
        }

    }

    const onSubmit= async (event) => {
        event.preventDefault()
        setErrorMessage('')
        setLoading(false)

        const _usermessage = web3.utils.soliditySha3("Discord", userId)
        const _userIdentity = new Identity(_usermessage)
        const useridentity = _userIdentity.generateCommitment()

        const _proposalMessage = web3.utils.soliditySha3(proposalName, groupId)
        const _proposalIdentity = new Identity(_proposalMessage)
        const proposalIdentity = _proposalIdentity.generateCommitment()

        const group = new Group(16)
        const _root = group.root.toString()
        
        const CID = await uploadData()
        if(CID !== 'error'){
            const proposal = {
                name:utils.formatBytes32String(proposalName),
                root:_root,
                coordinator:accounts[0],
                depth:16,
                CID:CID,
                state:0
            }
            // console.log(proposal)
            try {

                const result = await PolyZKVote.methods.createPoll(useridentity.toString(),groupId.toString(),proposalIdentity.toString(),proposal)
                .send({from:accounts[0]})

                console.log(result)
                setErrorMessage("Successfully created proposal.")
                window.location.reload()
            } catch (error) {
                console.log(error)
            }
            
        }
        setLoading(true)
        
    }

    return (

        <Base>
            <div className='row card m-1 shadow bg-light bg-gradient'>
                    <div className='d-flex'>
                        <h4 className="card-title p-2 flex-grow-1">Create Propsal</h4>
                    </div>
                </div>
            <form className="m-2 container card shadow " style={{ height: '100%' }} onSubmit={onSubmit}>
                <div className="mb-3">
                    <label htmlFor="proposalNameInput" className="form-label">Proposal Name</label>
                    <input id="proposalNameInput" aria-describedby="proposalNameHelp" type='text'
                        className="form-control"
                        value={proposalName}
                        onChange={(event) => setProposalName(event.target.value)}
                        required
                    />
                    <div id="proposalNameHelp" className="form-text">e.g."Proposal name."</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="proposalOverviewInput" className="form-label">Proposal Overview</label>
                    <textarea id="proposalOverviewInput" aria-describedby="proposalOverviewHelp" type='text'
                        className="form-control"
                        value={proposalOverview}
                        onChange={(event) => setProposalOverview(event.target.value)}
                        required
                    />
                    <div id="proposalOverviewHelp" className="form-text">e.g."Short description of your proposal."</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="proposalUsecaseInput" className="form-label">Use Case</label>
                    <textarea id="proposalUsecaseInput" aria-describedby="proposalUsecaseHelp" type='text'
                        className="form-control"
                        value={proposalUsecase}
                        required
                        onChange={(event) => setProposalUsecase(event.target.value)}
                    />
                    <div id="proposalUsecaseHelp" className="form-text">e.g."Usecase for your proposal"</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="proposalAskInput" className="form-label">Proposal Ask</label>
                    <textarea id="proposalAskInput" aria-describedby="proposalAskHelp" type='text'
                        className="form-control"
                        value={proposalAsk}
                        required
                        onChange={(event) => setProposalAsk(event.target.value)}
                    />
                    <div id="proposalAskHelp" className="form-text">e.g."What you need for your proposal"</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="pollStartdateInput" className="form-label">Poll Start Date</label>
                    <input id="pollStartdateInput" aria-describedby="pollStartdateHelp" type='date'
                        className="form-control"
                        value={pollStartDate}
                        onChange={(event) => setPollStartDate(event.target.value)}
                        required
                    />
                    <div id="pollStartdateHelp" className="form-text">e.g."Proposal poll start date"</div>
                </div>
                <div className="mb-3">
                    <label htmlFor="pollEnddateInput" className="form-label">Poll End Date</label>
                    <input id="pollEnddateInput" aria-describedby="pollEnddateHelp" type='date'
                        className="form-control"
                        value={pollEndDate}
                        onChange={(event) => setPollEndDate(event.target.value)}
                        required
                    />
                    <div id="pollStartdateHelp" className="form-text">e.g."Proposal poll end date"</div>
                </div>
                <span className="text-danger" hidden={!errorMessage}>{errorMessage}</span>
                <div className="mb-3 d-flex" style={{ alignItems: 'center' }}>
                    <button type="submit" className="btn btn-dark form-control" disabled={(!loading)}>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading}></span>
                        Create Proposal</button>
                </div>
            </form>

        </Base>
    )
}

export default CreateProposal