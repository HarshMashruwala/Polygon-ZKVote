import React, { useEffect, useState } from 'react'
import { create } from 'ipfs-http-client'
import JoinDAOCard from './JoinDAOCard'
import CreateDAOCard from './CreateDAOCard'
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import Base from './Base'
import '../css/DAO.css'
const web3 = require('web3');
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


function DAO() {
    const [joinedDAOList, setJoinedDAOList] = useState([]);
    const [createdDAOList, setCreatedDAOList] = useState([]);
    const [createDAOErrorMessage, setCreateDAOErrorMessage] = useState('')
    const [joinDAOErrorMessage, setJoinDAOErrorMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState('')
    const [createDAOId, setCreateDAOId] = useState('')
    const [createDAOName, setCreateDAOName] = useState('')
    const [createDAODesc, setCreateDAODesc] = useState('')
    const [createDAORole, setCreateDAORole] = useState('')
    const [joinedLoading, setJoinedLoading] = useState(true)
    const [joinDAOId, setJoinDAOId] = useState('')
    const [pageLoaded,setPageLoaded] = useState(true)

    useEffect(() => {
        const _userId = localStorage.getItem('discordId')
        setUserId(_userId)
        // checkOwner('795820411836563466')
        getCreatedDAO(_userId)
        getJoinedDAO(_userId)
        

    }, [])

    async function getJoinedDAO(_userId) {
        setPageLoaded(false)
        const _usermessage = web3.utils.soliditySha3("Discord", _userId)
        const _userIdentity = new Identity(_usermessage)
        const useridentity = _userIdentity.generateCommitment()

        await fetch(`${process.env.REACT_APP_RELAYURL}getJoinedDAOMember`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "identity": useridentity.toString() })
        }).then(result => result.json()).then(response => {
            if (response.DAO.length > 0) {
                response.DAO.forEach(async element => {
                    await fetch(`${process.env.REACT_APP_RELAYURL}getGroup`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ "groupIdentity": element.toString() })
                    }).then(result => result.json()).then(response => {
                        fetch(ipfsBaseURL + response.DAO_CID).then(result => result.json()).then(metaData => {
                            const joinedDaoData = {
                                name: metaData["name"],
                                channelId: metaData["channelId"],
                                desc: metaData["desc"],
                                role: metaData["role"],
                                DAOIdentity: metaData["identity"]
                            }
                            setJoinedDAOList(prevstate => [
                                ...prevstate,
                                joinedDaoData
                            ])
                        })
                        // console.log(response)
                    }).catch(err => {
                        console.log(err)
                    })
                })
            } 
        }).catch(err => {
            console.log(err)
        })
        setPageLoaded(true)
    }


    async function getCreatedDAO(_userId) {
        setPageLoaded(false)
        const _usermessage = web3.utils.soliditySha3("Discord", _userId)
        const _userIdentity = new Identity(_usermessage)
        const useridentity = _userIdentity.generateCommitment()

        await fetch(`${process.env.REACT_APP_RELAYURL}getCreatedDAOMember`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "identity": useridentity.toString() })
        }).then(result => result.json()).then(response => {
            if (response.DAO.length > 0) {
                response.DAO.forEach(async element => {
                    await fetch(`${process.env.REACT_APP_RELAYURL}getGroup`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ "groupIdentity": element.toString() })
                    }).then(result => result.json()).then(response => {
                        fetch(ipfsBaseURL + response.DAO_CID).then(result => result.json()).then(metaData => {
                            const createdDaoData = {
                                name: metaData["name"],
                                channelId: metaData["channelId"],
                                desc: metaData["desc"],
                                role: metaData["role"],
                                DAOIdentity: metaData["identity"]
                            }
                            setCreatedDAOList(prevstate => [
                                ...prevstate,
                                createdDaoData
                            ])
                        })
                        // console.log(response)
                    }).catch(err => {
                        console.log(err)
                    })
                })
            } 
        }).catch(err => {
            console.log(err)
        })
        setPageLoaded(true)
    }

    async function checkOwner(channelId) {
        let ownerStatus
        const oauthToken = localStorage.getItem('oauthToken')
        await fetch(`https://discord.com/api/users/@me/guilds`, {
            headers: {
                authorization: `Bearer ${oauthToken}`,
            },
        }).then(result => result.json()).then(response => {
            if(!("message" in response)){
                const ownedChannel = response.filter(elements => {
                    return elements.id === channelId
                })
                ownerStatus = ownedChannel[0].owner
                // console.log(ownedChannel)
                if (ownedChannel[0].owner === false) {
                    // console.log(ownedChannel[0].owner)
                    setCreateDAOErrorMessage("Only channel owner can create DAO.")
                    return false
                }
            }else {
                setCreateDAOErrorMessage(response.message)
            }
        }).catch(error => {
            // console.log(error)
            setCreateDAOErrorMessage("Opps! Somthing went wrong.")
        })
        return ownerStatus
    }

    async function uploadData() {
        const _message = web3.utils.soliditySha3(createDAOId, createDAORole)
        const identity = new Identity(_message)
        const DAOidentity = identity.generateCommitment()
        try {
            const metaDataPath = await ipfsClient.add(JSON.stringify({
                name: createDAOName,
                channelId: createDAOId,
                desc: createDAODesc,
                role: createDAORole,
                identity: DAOidentity.toString()
            }))
            // console.log(metaDataPath)
            await ipfsClient.pin.add(metaDataPath.path.toString())
            return metaDataPath.path.toString()

        } catch (err) {
            // console.log(err)
            setCreateDAOErrorMessage("Opps! Somthing went wrong.")
            return 'error'
        }

    }

    async function updateGroup(_name, _channelID, _CID, _role, _type, _allIdentity) {
        const _DAOmessage = web3.utils.soliditySha3(_channelID, _role)
        const _DAOidentity = new Identity(_DAOmessage)
        const DAOidentity = _DAOidentity.generateCommitment()

        const _usermessage = web3.utils.soliditySha3("Discord", userId)
        const _userIdentity = new Identity(_usermessage)
        const useridentity = _userIdentity.generateCommitment()

        const _provider = "Discord"

        let _result
        let _error

        const group = new Group(16)
        if (_allIdentity.length > 0) {
            group.addMembers(_allIdentity)
        }

        const _root = group.root.toString()
        try {
            await fetch(`${process.env.REACT_APP_RELAYURL}updateGroup`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "provider": _provider,
                    "name": _name,
                    "channelID": _channelID,
                    "root": _root,
                    "depth": 16,
                    "CID": _CID,
                    "groupId": DAOidentity.toString(),
                    "identity": useridentity.toString(),
                    "role": _role.toString(),
                    "type": _type
                })
            }).then(result => result.json()).then(response => {
                // console.log(response)
                _result = response.result
                _error = response.error
            })
        } catch (error) {
            // console.log(error)
            _result = 'Failed'
            _error = 'Opps! Something went wrong.'
        }
        return { "result": _result, "error": _error }
    }

    const createDAO = async (event) => {
        event.preventDefault()
        setCreateDAOErrorMessage('')
        setLoading(false)
        try {
            const _checkOwner = await checkOwner(createDAOId)
            // console.log(_checkOwner)
            if (_checkOwner === true) {
                const CID = await uploadData()
                // console.log(CID)
                if (CID !== 'error') {
                    // console.log('success')
                    const _allMember = []
                    const result = await updateGroup(createDAOName, createDAOId, CID, createDAORole, true, _allMember)
                    // console.log(result)
                    if (result.result === 'Success'){
                        setCreateDAOErrorMessage("DAO Created Successfully.")
                        window.location.reload()
                    }
                    else {
                        setCreateDAOErrorMessage("Opps! Something went wrong.")
                    }
                }
            }

        } catch (error) {
            // console.log(error)
            setCreateDAOErrorMessage("Opps! Something went wrong.")
        }
        setLoading(true)
        
    }

    async function checkEnoughRole(_DAOIdentity) {
        let requiredRole,channelId,userStatus,channelName,CID
        const oauthToken = localStorage.getItem('oauthToken')
        await fetch(`${process.env.REACT_APP_RELAYURL}getGroup`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "groupIdentity": _DAOIdentity.toString() })
        }).then(result => result.json()).then(async response => {
            // console.log(response)
            requiredRole=response.DAORole
            channelId = response.DAOChannel
            channelName= response.DAOName
            CID = response.DAO_CID
            await fetch(`https://discord.com/api/users/@me/guilds/${channelId}/member`, {
                headers: {
                    authorization: `Bearer ${oauthToken}`,
                },
            }).then(result => result.json()).then(response => {
                // console.log(response)
                if(!("message" in response)){
                    const roleFilter = response.roles.filter(element => {
                        return requiredRole === element.toString()
                    })
                    if(roleFilter.length>0){
                        userStatus = {"hasEnoughRole":true}
                    }else{
                        userStatus = {"hasEnoughRole":false}
                        setJoinDAOErrorMessage("Opps! User is not belong to required server role.")
                    }
                    // console.log(roleFilter)
                } else {
                    setJoinDAOErrorMessage(response.message)
                    userStatus = {"hasEnoughRole":false}
                }
                
            }).catch(error => {
                // console.log(error)
                setJoinDAOErrorMessage("Opps! Somthing went wrong.")
            })

        }).catch(err => {
            // console.log(err)
            setJoinDAOErrorMessage("Opps! Somthing went wrong.")
        })
        return {"userStatus":userStatus,"role":requiredRole,"name":channelName,"channelId":channelId,"CID":CID}
    }

    const joinDAO = async (event) => {
        event.preventDefault()
        setJoinDAOErrorMessage('')
        setJoinedLoading(false)
        const _usermessage = web3.utils.soliditySha3("Discord", userId)
        const _userIdentity = new Identity(_usermessage)
        const useridentity = _userIdentity.generateCommitment()
        try {
            const checkRole = await checkEnoughRole(joinDAOId)
            if(checkRole.userStatus.hasEnoughRole){
                await fetch(`${process.env.REACT_APP_RELAYURL}getMemberToGroup`,{
                    method:"POST",
                    headers: { 'Content-Type': 'application/json' },
                    body:JSON.stringify({groupIdentity:joinDAOId})
                }).then(result=>result.json()).then(async response=>{
                    const _allIdentity = response.identity
                    const isExists = _allIdentity.filter(element=>{
                        return useridentity.toString() === element
                    })
                    if(isExists.length > 0){
                        setJoinDAOErrorMessage("Opps! Looks like you have already joined DAO.")
                    }else {
                        const result = await updateGroup(checkRole.name,checkRole.channelId,checkRole.CID,checkRole.role,false,_allIdentity)
                        if(result.result === "Success"){
                            setJoinDAOErrorMessage('Successfully Joined DAO.')
                            window.location.reload()
                        }else{
                            setJoinDAOErrorMessage("Opps! Something went wrong.")
                        }
                    }
                }).catch(err=>{
                    // console.log(err)
                    setJoinDAOErrorMessage("Opps! Something went wrong.")
                })
            }


        } catch (err) {
            // console.log(err)
            setJoinDAOErrorMessage("Opps! Something went wrong.")
        }
        setJoinedLoading(true)
       
    }

    function RenderJoinedCard() {
        return (joinedDAOList.map((i, index) => {
            return (
                <JoinDAOCard
                    key={index}
                    name={i["name"]}
                    channelId={i["channelId"]}
                    desc={i["desc"]}
                    DAOIdentity={i["DAOIdentity"]}
                    role={i["role"]}
                />
            )
        }))
    }

    function RenderCreatedCard() {
        return (createdDAOList.map((i, index) => {
            return (
                <CreateDAOCard
                    key={index}
                    name={i["name"]}
                    channelId={i["channelId"]}
                    desc={i["desc"]}
                    DAOIdentity={i["DAOIdentity"]}
                    role={i["role"]}
                />
            )
        }))
    }

    return (
        <Base>
            <div className="text-center">
            <span className="spinner-border spinner-border m-2" role="status" aria-hidden="true" hidden={pageLoaded} />
            </div>
            <div className='DAOContainer' hidden={!pageLoaded}>

                <div className='row card m-1 shadow bg-light bg-gradient'>
                    <div className='d-flex'>
                        <h4 className="card-title p-2 flex-grow-1">Welcome to DAO Portal</h4>
                        <button
                            className="btn btn-primary m-2 p-2 " data-bs-toggle="modal" data-bs-target="#DAOModal" >
                            Join DAO
                        </button>
                        <button
                            className="btn btn-secondary m-2 p-2" data-bs-toggle="modal" data-bs-target="#CreateDAOModal">
                            Create DAO
                        </button>
                    </div>
                </div>
                <hr className="dropdown-divider" style={{ height: "8px" }} />
                <div className='row m-1'>
                    <div className="card shadow">
                        <div className="card-header">Joined DAO</div>
                        <div className="card-body text-secondary">
                            <RenderJoinedCard />
                        </div>
                    </div>
                </div>
                <hr className="dropdown-divider" style={{ height: "8px" }} />
                <div className='row m-1'>
                    <div className="card shadow">
                        <div className="card-header">Created DAO</div>
                        <div className="card-body text-secondary">
                            <RenderCreatedCard />
                        </div>
                    </div>
                </div>
                {/* Join DAO Modal */}
                <div className="modal fade" id="DAOModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="DAOLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={joinDAO}>
                                <div className="modal-header">
                                    <h5 className="modal-title" id="DAOLabel">Join DAO</h5>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="groupIdInput" className="form-label">DAO Identity</label>
                                        <input type="text" className="form-control" id="groupIdInput" placeholder="128957469523"
                                            value={joinDAOId}
                                            onChange={event => setJoinDAOId(event.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <span className="text-danger" hidden={!joinDAOErrorMessage}>{joinDAOErrorMessage}</span>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="submit" className="btn btn-primary" disabled={(!joinedLoading)}>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={joinedLoading} />
                                        Join DAO</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {/* Create DAO Modal */}
                <div className="modal fade" id="CreateDAOModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="CreateDAOLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="CreateDAOLabel">Create DAO</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <form onSubmit={createDAO}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="groupIdInput" className="form-label">DAO Channel Id</label>
                                        <input type="number" className="form-control" id="groupIdInput" placeholder="128957469523"
                                            value={createDAOId}
                                            onChange={(event) => setCreateDAOId(event.target.value)}
                                            required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="DAONameInput" className="form-label">DAO Name</label>
                                        <input type="text" className="form-control" id="DAONameInput" placeholder="PolyVote"
                                            value={createDAOName}
                                            onChange={(event) => setCreateDAOName(event.target.value)}
                                            required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="DAOdescInput" className="form-label">DAO Description</label>
                                        <input type="text" className="form-control" id="DAOdescInput" placeholder="This DAO helps to vote Polymously."
                                            value={createDAODesc}
                                            onChange={(event) => setCreateDAODesc(event.target.value)}
                                            required />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="DAOroleInput" className="form-label">DAO Role</label>
                                        <input type="text" className="form-control" id="DAOroleInput" placeholder="DAO role."
                                            value={createDAORole}
                                            onChange={(event) => setCreateDAORole(event.target.value)}
                                            required />
                                    </div>
                                </div>
                                <span className="text-danger" hidden={!createDAOErrorMessage}>{createDAOErrorMessage}</span>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="submit" className="btn btn-primary" disabled={(!loading)}>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" hidden={loading}></span>
                                        Create DAO</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Base>

    )
}

export default DAO