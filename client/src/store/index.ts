import {createStore, applyMiddleware, compose} from 'redux'
import logger from 'redux-logger'

import {rootReducer} from './reducers'
const middleware =  [logger]

export const store = createStore(
    rootReducer,
    compose(applyMiddleware(...middleware))
)