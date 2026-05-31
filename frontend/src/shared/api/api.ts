import {
  authGoogle,
  sendCode,
  verifyCode,
  getTokens,
  createPassword,
  resetPassword,
  setNewPassword,
} from './auth';
import { changeAvatar, checkNickname, me, onBoard } from './user';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';

const api = {
  auth: {
    google: authGoogle,
    sendCode: sendCode,
    verifyCode: verifyCode,
    getTokens: getTokens,
    createPassword: createPassword,
    resetPwd: resetPassword,
    setNewPassword: setNewPassword,
  },
  user: {
    checkNickname: checkNickname,
    changeAvatar: changeAvatar,
    onBoard: onBoard,
    me: me,
  },
};

export { api };
