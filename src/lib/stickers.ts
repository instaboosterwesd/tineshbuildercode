// Animated stickers (Lottie) used across the app.
// One module so every sticker stays matched to the thing it labels.
import activeKeys from "@/assets/sticker-active-keys.tgs.asset.json";
import addFundsPlus from "@/assets/sticker-add-funds-plus.tgs.asset.json";
import apiSettings from "@/assets/sticker-api-settings.tgs.asset.json";
import backArrow from "@/assets/sticker-back-arrow-emoji.tgs.asset.json";
import balanceEmoji from "@/assets/sticker-balance-emoji.tgs.asset.json";
import bankEmoji from "@/assets/sticker-bank-emoji.tgs.asset.json";
import bell from "@/assets/sticker-bell.tgs.asset.json";
import chooseAmount from "@/assets/sticker-choose-amount-emoji.tgs.asset.json";
import closeEmoji from "@/assets/sticker-close-emoji.tgs.asset.json";
import crown from "@/assets/sticker-crown.tgs.asset.json";
import customAmount from "@/assets/sticker-custom-amount-emoji.tgs.asset.json";
import downloadEmoji from "@/assets/sticker-download-emoji.tgs.asset.json";
import editProfile from "@/assets/sticker-edit-profile.tgs.asset.json";
import editTitle from "@/assets/sticker-edit-title-emoji.tgs.asset.json";
import giftCode from "@/assets/sticker-gift-code.tgs.asset.json";
import googleLottie from "@/assets/sticker-google-lottie.tgs.asset.json";
import historyEmoji from "@/assets/sticker-history-emoji.tgs.asset.json";
import historyTitle from "@/assets/sticker-history-title-emoji.tgs.asset.json";
import keyLottie from "@/assets/sticker-key-lottie.tgs.asset.json";
import lockEmoji from "@/assets/sticker-lock-emoji.tgs.asset.json";
import logoutFlash from "@/assets/sticker-logout-flash.tgs.asset.json";
import minDeposit from "@/assets/sticker-min-deposit-emoji.tgs.asset.json";
import monthlySales from "@/assets/sticker-monthly-sales.tgs.asset.json";
import myOrders from "@/assets/sticker-my-orders.tgs.asset.json";
import otpClipboard from "@/assets/sticker-otp-clipboard.tgs.asset.json";
import phoneArrow from "@/assets/sticker-phone-arrow.tgs.asset.json";
import phoneSpidey from "@/assets/sticker-phone-spidey.tgs.asset.json";
import proceedEmoji from "@/assets/sticker-proceed-emoji.tgs.asset.json";
import profileLottie from "@/assets/sticker-profile-lottie.tgs.asset.json";
import qrHint from "@/assets/sticker-qr-hint-emoji.tgs.asset.json";
import refreshEmoji from "@/assets/sticker-refresh-emoji.tgs.asset.json";
import rupeeEmoji from "@/assets/sticker-rupee-emoji.tgs.asset.json";
import saveEmoji from "@/assets/sticker-save-emoji.tgs.asset.json";
import searchEmoji from "@/assets/sticker-search-emoji.tgs.asset.json";
import sendEmoji from "@/assets/sticker-send-emoji.tgs.asset.json";
import sendFlash from "@/assets/sticker-send-flash.tgs.asset.json";
import shieldVerify from "@/assets/sticker-shield-verify.tgs.asset.json";
import shopStore from "@/assets/sticker-shop-store.tgs.asset.json";
import shoppingCart from "@/assets/sticker-shopping-cart.tgs.asset.json";
import signinFlame from "@/assets/sticker-signin-flame.tgs.asset.json";
import telegramLottie from "@/assets/sticker-telegram-lottie.tgs.asset.json";
import todayEmoji from "@/assets/sticker-today-emoji.tgs.asset.json";
import todaySales from "@/assets/sticker-today-sales.tgs.asset.json";
import trackEmoji from "@/assets/sticker-track-emoji.tgs.asset.json";
import verifiedBadge from "@/assets/sticker-verified-badge.tgs.asset.json";
import verifiedCheck from "@/assets/sticker-verified-check.tgs.asset.json";
import walletLottie from "@/assets/sticker-wallet-lottie.tgs.asset.json";
import welcomeEmoji from "@/assets/sticker-welcome-emoji.tgs.asset.json";
import welcomeYoda from "@/assets/sticker-welcome-yoda.tgs.asset.json";

export const STICKERS = {
  // navigation + page headers
  home: shopStore.url,
  wallet: walletLottie.url,
  orders: myOrders.url,
  leaders: crown.url,
  profile: profileLottie.url,
  // home page
  search: searchEmoji.url,
  video: giftCode.url,
  // wallet / add funds
  addFunds: addFundsPlus.url,
  balance: balanceEmoji.url,
  rupee: rupeeEmoji.url,
  bank: bankEmoji.url,
  qrHint: qrHint.url,
  chooseAmount: chooseAmount.url,
  minDeposit: minDeposit.url,
  customAmount: customAmount.url,
  send: sendEmoji.url,
  copy: otpClipboard.url,
  // orders / history
  track: trackEmoji.url,
  download: downloadEmoji.url,
  refresh: refreshEmoji.url,
  history: historyEmoji.url,
  historyTitle: historyTitle.url,
  // profile
  editProfile: editProfile.url,
  editTitle: editTitle.url,
  save: saveEmoji.url,
  logout: logoutFlash.url,
  lock: lockEmoji.url,
  telegram: telegramLottie.url,
  // login
  welcome: welcomeEmoji.url,
  welcomeYoda: welcomeYoda.url,
  flame: signinFlame.url,
  google: googleLottie.url,
  shield: shieldVerify.url,
  proceed: proceedEmoji.url,
  // shared bits
  verified: verifiedCheck.url,
  verifiedBadge: verifiedBadge.url,
  close: closeEmoji.url,
  back: backArrow.url,
  bell: bell.url,
  cart: shoppingCart.url,
  today: todayEmoji.url,
  todaySales: todaySales.url,
  monthlySales: monthlySales.url,
  key: keyLottie.url,
  activeKeys: activeKeys.url,
  apiSettings: apiSettings.url,
  phone: phoneSpidey.url,
  phoneArrow: phoneArrow.url,
  sendFlash: sendFlash.url,
} as const;

export type StickerName = keyof typeof STICKERS;

export function stickerUrl(name: StickerName) {
  return STICKERS[name];
}
