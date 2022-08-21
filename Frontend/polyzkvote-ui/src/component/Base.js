import React,{useState,useEffect,useRef,useCallback} from 'react';
import {Link, Router} from 'react-router-dom';
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
const web3 = require('web3');


function Base({children}) {

  const [userId,setUserId] = useState('')
  const [isLoggedIn,setIsLoggedIn] = useState(false);
  const [disURL,setDisURL] = useState(`https://discord.com/api/oauth2/authorize?client_id=${process.env.REACT_APP_DISCORDCLINTID}&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&response_type=token&scope=identify%20guilds%20guilds.members.read`)
    // 'https://discord.com/api/oauth2/authorize?client_id=996604102727446548&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2F&response_type=token&scope=identify%20guilds.members.read'
 
  useEffect(()=>{
    // console.log(process.env.REACT_APP_TITLE)
    async function checkUser(){
    const authData = window.location.hash
    const oauthToken = localStorage.getItem('oauthToken')
    
    if(oauthToken !== ''){

      await fetch('https://discord.com/api/users/@me', {
          headers: {
            authorization: `Bearer ${oauthToken}`,
          },
        })
          .then(result => result.json())
          .then(response => {
            
            if(response.code == 0){
              setIsLoggedIn(false)
              localStorage.setItem('oauthToken','')
              
            } else {
              setUserId(response.id)
              setIsLoggedIn(true)
              // console.log(response)
            }
            
          })
          .catch(error => {
            
            setIsLoggedIn(false)
            localStorage.setItem('oauthToken','')
            
          });

    } else {
      setIsLoggedIn(false)
      if(authData !== ''){
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const [accessToken, tokenType, state] = [fragment.get('access_token'), fragment.get('token_type'), fragment.get('state')];
        // console.log(accessToken +' '+ tokenType+' '+state)
        localStorage.setItem('oauthToken',accessToken)
        // console.log(localStorage.getItem('oauthToken'))
        await fetch('https://discord.com/api/users/@me', {
          headers: {
            authorization: `${tokenType} ${accessToken}`,
          },
        })
          .then(result => result.json())
          .then(response => {
            // console.log(response)
            if(response.code == 0){
              setIsLoggedIn(false)
              localStorage.setItem('oauthToken','')
              localStorage.setItem('discordId','')
              // console.log('User Not oauth')
            } else {
              // console.log(response)
              setUserId(response.id)
              localStorage.setItem('discordId',response.id)
            setIsLoggedIn(true)
            }
            
          })
          .catch(error => {
            // console.log(error)
            setIsLoggedIn(false)
            // console.log('User LoggedIn :- ',false)
          });
        }
    }
    }
    checkUser()
    if(userId !== '') {
      // console.log(userId)
      generateIdentity(userId)
    }
    
  },[userId])    

  async function getAllIdentity() {
      await fetch(`${process.env.REACT_APP_RELAYURL}getIdentity`).then(result => result.json()).then(response => {
        // console.log(response)
        return response
      } )
  }

  async function generateIdentity(_userId) {

    const _message = web3.utils.soliditySha3("Discord",_userId)
    const identity = new Identity(_message)
    const identityCommitment = identity.generateCommitment()
    const result = await fetch(`${process.env.REACT_APP_RELAYURL}getIdentity`).then(result => result.json()).then(response => {
      // console.log(response)
      return response
    } )
    var _getAllIdentity = result.identity
    // console.log(_getAllIdentity)
    if(_getAllIdentity.length > 0) {
      const isExists = _getAllIdentity.filter(row => {
        // console.log(row)
        // console.log(identityCommitment)
        return row === identityCommitment.toString()
      })
      // console.log(isExists)
      if(isExists.length === 0) {
        _getAllIdentity.push(identityCommitment)
        await updateGroup(_getAllIdentity,identityCommitment)
      }
    }else {
      _getAllIdentity.push(identityCommitment)
      await updateGroup(_getAllIdentity,identityCommitment)
    }
  }

  async function updateGroup(_allIdentity,_identity) {
    const _provider = "Discord"
    const _name = "Identity"
    const _channelID = 0
    const _groupId = 1
    const group = new Group(16)
    group.addMembers(_allIdentity)
    const _root = group.root.toString()
    await fetch(`${process.env.REACT_APP_RELAYURL}updateGroup`,{
      method:"POST",
      headers: {'Content-Type':'application/json'},
      body:JSON.stringify({"provider":_provider,
            "name":_name,
            "channelID":_channelID,
            "root":_root,
            "depth":16,
            "CID":'',
            "groupId":_groupId,
          "identity":_identity.toString(),
          "role":'',
            "type":false})
    }).then(result => result.json()).then(response => {
      // console.log(response)
    })
  }

  function userLogout(){
    // console.log('User Logout')
    localStorage.setItem('oauthToken','')
    localStorage.setItem('discordId','')
    setIsLoggedIn(false)
    setUserId('')
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top" >
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">PolyZKVote </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarToggler" aria-controls="navbarToggler" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarToggler">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" aria-current="page" to={{pathname : '/dao',state:[{isLoggedIn:isLoggedIn}]}}>DAO</Link>
              </li>
            </ul>
            <form className="d-flex">
            <a
                  className="btn btn-outline-light" style={{border:'round'}} href={disURL} hidden = {isLoggedIn}
                  >
                  Login
            </a>
            <a
                  className="btn btn-outline-light" style={{border:'round'}} hidden = {!isLoggedIn} onClick = {userLogout}
                  >
                  Logout
            </a>
            </form>
          </div>
        </div>
      </nav>
      <div>
        {children}
      </div>
    </div>
  )
}
export default Base