'use strict'
const path              = require('path'),
    async               = require('async'),
    helperLib           = require(path.resolve('./config/lib/helper_lib')),
    UserProfileModel    = require('../models/user.profile.model');



exports.register = (req, res) => {

    let userProfileModel = new UserProfileModel(req.body);

    userProfileModel.save((err, saved) => {

        let resObj = {};
        let Common = new helperLib.common.common();

        if (err) {
            let message = err.code == '11000' ? `${req.body.email} ${helperLib.messages.alreadyTaken}` : 'Registration failed';
                resObj = Common.generateResponses(400, 'failed', message, err);
        } else {
                resObj = Common.generateResponses(200, 'success', helperLib.messages.accoundCreated, null, saved);
        }

        res.status(resObj.statusCode).json(resObj);

    })
}


exports.login = (req, res) => {

    let conditions = {'email': req.body.email }, 
        requiredParams = ['email', 'password'],
        fields = {__v: 0, created_at: 0, updated_at: 0, };

    let Common = new helperLib.common.common();
    let validator = Common.validateArgument(req.body, requiredParams);    

    if (validator.length>0) {
        let resObj      = {};
        resObj = Common.generateResponses(400, 'failed', `${validator.join(', ')} ${helperLib.messages.absent}`); 
        return res.status(resObj.statusCode).json(resObj);

    }

    UserProfileModel.findOne(conditions, fields, (err, user) => {

        let Crypt       = new helperLib.crypt.crypt();
        let isValid     = Crypt.compareHash(req.body.password, user ? user.password : '');
        let resObj      = {};

        if (user && isValid) {

            user.password = undefined;

            let Jwt = new helperLib.jwt();
            let buf = new Buffer.from(JSON.stringify(user));

            resObj = Common.generateResponses(200, 'success', helperLib.messages.loggedInSuccess, null, user);            
            resObj.auth = Jwt.sign(buf);

        } else if (err) {

               resObj = Common.generateResponses(500, 'failed', helperLib.messages.unableTologin, err);            

        } else {

            resObj = Common.generateResponses(400, 'failed', helperLib.messages.incorrectLoginDetail); 

        }

        res.status(resObj.statusCode).json(resObj);
    });

}


exports.updateProfile = (req, res) => {

    let Common      = new helperLib.common.common(); 
    let data = req.body,
        conditions = {'email': data.email },
        resObj = {};       

    if (data.email != req.tokenInfo.email) {

            resObj = Common.generateResponses(401, 'failed', `unauthorized request: account can not update`);             

            return res.status(resObj.statusCode).json(resObj);    

    }

    delete data.password;
    delete data.email;

    if (Object.keys(data).length === 0) {

            resObj = Common.generateResponses(400, 'failed', 'fields not found to update');             

            return res.status(resObj.statusCode).json(resObj);    

    }

    UserProfileModel.update(conditions, data, (err, update) => {

        if (err) {

            resObj = Common.generateResponses(500, 'failed', `update failed for ${data.email}`, err);                         

        } else if (update.nModified == 1) {

            resObj = Common.generateResponses(200, 'success', 'Account updated successfully', null, update);                         

        } else if (update.nModified == 0 && update.n == 1){

            resObj = Common.generateResponses(400, 'failed', 'profile can not update due to some technocal reason');                                     

        }else{
            resObj = Common.generateResponses(400, 'failed', `${req.tokenInfo.email} does not exist`, err);                                                 
        }

        res.status(resObj.statusCode).json(resObj);
    });

}

exports.changePassword = (req, res) => {


    let conditions = {'email': req.body.email }; 
    let Common      = new helperLib.common.common();

    async.waterfall([        

        (cb) => {
            
            if (req.body.confirmPassword != req.body.newPassword) {

                let resObj = Common.generateResponses(400, 'failed', 'New password and comfirm password are not equal');                 

                cb(resObj);   

            }else{
                cb(null);
            }

        },

        (cb) => {
            if (req.body.email != req.tokenInfo.email) {

                let resObj = Common.generateResponses(401, 'failed', `unauthorized request: password can not update`);                 

                cb(resObj); 

            }else{
                cb(null);
            }
        },


        (cb) => {

            UserProfileModel.findOne(conditions, {'password':1, '_id':0}, (err, user) => {

                let Crypt = new helperLib.crypt.crypt();

                let isValid = Crypt.compareHash(req.body.password, user ? user.password : '')

                if (!user || err || !isValid) {

                    let message = err ? 'some error occurred when finding user' 
                                         : !user 
                                         ? 'user not found' 
                                         : 'incorrect current password';  

                    let resObj = Common.generateResponses(400, 'failed', message, err);                                             

                    cb(resObj); 

                } else {

                    cb(null);  
                  
                }

            })

        }, 

        (cb) => {

            let Crypt = new helperLib.crypt.crypt();
            let update = {password: Crypt.hash(req.body.newPassword)};

            UserProfileModel.update(conditions, update, (err, update) => {

                if (update.nModified == 1) {

                    let resObj = Common.generateResponses(200, 'success', 'password changed successfully');                     

                    cb(resObj);

                }else{

                    let resObj = Common.generateResponses(400, 'failed', 'some error occurred in update password', err);     

                    cb(resObj);                     
                }

            });

        }
        ], (err, final) => {

            let resObj = err || final;

            res.status(resObj.statusCode).json(resObj);

        })
}


exports.resetPassword = (req, res) => {
/*
    1. it depends reset link will be sent over email

    2. or forgot password to be get set without sending any `

*/

//@ code according 2.
    let bodyData = req.tokenInfo,
        resObj = {};
    let Common      = new helperLib.common.common();    
    
    //@ finding the user    
    UserProfileModel.findOne({'email' : bodyData.email}, projection, (err, user) => {
        //@ if any error 
        if(err){
            resObj = Common.generateResponses(500,'failed','Something went wrong ');
            resObj.error = err;
        }
        
        //@ if user exists
        if(user){
        
            //@ check if password or confirm pasword is same
            if (req.body.confirmPassword != req.body.newPassword) {
                resObj = Common.generateResponses(400,'failed','Mismatch password ');
                res.status(resObj.statusCode).json(resObj);
            }else{

             let Crypt = new helperLib.crypt.crypt()
             let passwordUpdate = {password: Crypt.hash(req.body.newPassword)}
    
                userProfileModel.update({'email':bodyData.email},passwordUpdate,(err,update)=>{
                   if (update.nModified == 1) {
                        resObj = Common.generateResponses(200,'success','Password changed successfully');
                    }else{
                        resObj = Common.generateResponses(400,'failed',err || 'some error occurred in update password' );
                        resObj.error = err 
                    }
                    res.status(resObj.statusCode).json(resObj);
                })   
            }
        }
       
    });
}