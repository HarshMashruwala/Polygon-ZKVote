import React, { useEffect } from 'react'
import Base from './Base'
import '../css/Home.css'


function Home() {


    return (
        <Base>
            <div className="HomeContainer">
                <div className="row mt-3 align-items-center">
                    
                        <h1>PolyZKVote system for Web3 Community</h1>
                        <br />
                        <p>
                        Polygon ZKVote is a voting platform for growing the web3.0 community.Polygon ZKVote is used to protect the privacy of voter using Zero Knowledge.
                        </p>
                    
                    {/* <div className='col-6'>
                        {/* <img
                            src={education} /> }
                    </div> */}
                </div>
                <div className="row mt-3 align-items-center">
                    <h1>Overview</h1>
                    <p>
                    This application allows anyone to create new voting process or to vote on already existing processes. 
                        In order to vote users need to register their identity using Discord. 
                        Registration is done with the use of Semaphore smart contracts. 
                        User’s IdentityCommitment is stored on chain, but their identity remains private. 
                        When casting a vote, proof of registration is created and verified by Semaphore smart contract. 
                        Users are not allowed to vote on the same voting process twice. 
                        Double voting is disabled with the use of external nullifiers (voting process id). 
                        Nullifier hash (hash of external nullifier and identity nullier) is stored on chain and checked every time voting happens, which prevents double voting.
                    </p>
                </div>
                <div className="row mt-3 align-items-center">
                    <h1>Usecase</h1>
                    <div>
                        <p>
                        This application can be used by DAOs as a governance tool. 
                        DAO members can vote on important decisions without revealing which voting option they chose. 
                        This privacy aspect is really important as it prevents discrimination and possible conflicts inside DAO. 
                        Polygon ZKVote can essentially be used for any big public decision, where keeping privacy is important.

                        </p>
                        <br/>
                        <p className="fw bold">
                            Note: Currently this demo is only for POC. 
                            Here we are using Discord server as authorization to create DAO,joined DAO and create identity.
                            In future this will be replace by other authentication system.Users only get access to the voting page and 
                            get voting rights after the user is verified by Discord role.

                        </p>
                    </div>
                </div>
                <div className="row mt-3 align-items-center">
                    <h1>Steps to use Polygon ZKVote</h1>
                    <div>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item">1. Login - Login with Discord to generate ZK identity. (Transaction done by Relayer)</li>
                            <li className="list-group-item">2. Create DAO - Discord server's admin has access to create DAO.
                            Also include the Discord role so that, members belonging to that role can join DAO and participate in the voting process. (Transaction done by Relayer)</li>
                            <li className="list-group-item">3. Join DAO - Use DAO identity to join DAO (Transaction done by Relayer)</li>
                            <li className="list-group-item">4. Create Proposal - DAO's Admin can create proposal.</li>
                            <li className="list-group-item">5. Add Voter - DAO's Admin can add voter to proposal</li>
                            <li className="list-group-item">6. Start Poll - DAO's admin can start poll</li>
                            <li className="list-group-item">7. Cast Vote - Voter belongs to DAO can cast vote- Use ZK for voting (Transaction done by Relayer)</li>
                            <li className="list-group-item">8. End Poll - DAO's admin can end poll</li>
                            <li className="list-group-item">9. View Result - Any voter can see voting result. (Transaction done by Relayer)</li>
                        </ul>
                    </div>
                </div>

            </div>
        </Base>
    )
}

export default Home