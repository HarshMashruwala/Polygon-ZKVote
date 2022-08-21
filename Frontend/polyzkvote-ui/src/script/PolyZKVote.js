import web3 from './web3_'
import PolyZKVoteAbi from '../abi/PolyZKVote.json'


const instance = new web3.eth.Contract(PolyZKVoteAbi.abi,'0xB8590Db0744D508168d0DaE4F0aE4368fC3E10de')  
// console.log(instance)

export default instance
