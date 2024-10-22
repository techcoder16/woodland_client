import { DELETE_USER, GET_USER_SUCCESS } from "../action"
import { GET_USER_FETCH ,DELETE_USER_SUCCESS} from "../action";

const UserDataReducer = (state:any = {},action:any) =>
{
    switch (action.type){
    case GET_USER_FETCH:
      
        return {...state, loading: true};
    case GET_USER_SUCCESS:
    
        return { ...state, data: action.data, loading: false }
        
    case DELETE_USER:
        
            return {...state, loading: true};

    case DELETE_USER_SUCCESS:
        
        return { ...state, deleteData: action.deleteData, loading: false }   

    default:
        return state;    
    }
    
}

export default UserDataReducer;