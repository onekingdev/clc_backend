import axios from "axios";
require("dotenv").config();
var crypto = require('crypto');
let URL = require("url").URL;

export const vimeoDataExtractor = async (url: string) => {
  // https://vimeo.com/253989945
  // http://vimeo.com/api/v2/video/253989945.json
  let path = new URL(url).pathname.substr(1, new URL(url).pathname.length);

  path = path.split("/");

  return await axios
    .get(
      `http://vimeo.com/api/v2/video/${
        path.length === 2 ? path[1] : path[0]
      }.json`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((res: any) => {
      let data = {
        title: res.data[0].title,
        description: res.data[0].description,
        image: res.data[0].thumbnail_large ? res.data[0].thumbnail_large : "",
        duration: res.data[0].duration,
      };
      return data;
    })
    .catch((error) => {
      return null;
      //console.log(error)
    });
};

export const parseHandHistory = (record: string) => {
  if (record === "") return { noHandHistory: true };
  
  const seatRegex =
    /Seat\s+[#?|\']?(?<seat_number>\d+)\'?:\s+(?<seat_name>[a-zA-Z0-9!@#\$%\^\&*\)\(+=._/\-\s\']*)\s+\(\s*(?<seat_amount>\S+(\s+\S+)*)\s*\)/;
  const seatAmountRegex = /(?<seat_amount>(\d{1,3}(\,\d{1,3})*)*(\.\d{1,2})?)/;
  const flopRegex =
    /\*+\s+(?<description>\w+(\s+\w+)*)\s+\*+\s+\[\s*(?<cards_0>[a-zA-Z0-9]{2}(\s*\,?\s*[a-zA-Z0-9]{2})*)\s*\](\s+\[\s*(?<cards_1>[a-zA-Z0-9]{2}(\s*\,?\s*[a-zA-Z0-9]{2})*)\s*\])?(\s+\[\s*(?<cards_2>[a-zA-Z0-9]{2}(\s*\,?\s*[a-zA-Z0-9]{2})*)\s*\]*)?/;
  const records = record.split("\n");
  let players = [];
  let flop: string[] = [];
  let mapPlayers: { [key: string]: any } = {};
  let hands = [];
  for (let i = 0; i < records.length; i++) {
    const line = records[i];
    const result = seatRegex.exec(line)?.groups;

    if (result) {
      const amountResult = seatAmountRegex.exec(result.seat_amount)?.groups;
      if (amountResult) {
        const player = {
          number: result.seat_number,
          name: result.seat_name,
          initAmount: parseInt(amountResult.seat_amount.replace(/,/g, ""), 10),
          cards: [],
        };
        players.push(player);
        // @ts-ignore
        mapPlayers[player.name] = player;
      }
    }
  }

  const words = players
    .map((p) => `\\b${p.name.replace(" ", "\\s+")}\\b`)
    .join("|");
  const handRegex = new RegExp(
    `(?<seat_name>${words})\\:?\\s+(?<hand>[A-Za-z]+(\\s+[A-Za-z]+)*)(\\s*)\\[?(\\s*)(?<seat_amount>(([0-9]{1,3}(\\,[0-9]{1,3})*)*(\\.[0-9]{1,2})?)|[a-zA-Z0-9\\,\\$\\s]*)?\\s*(?<to>([a-zA-Z]*))?\s*(?<seat_amount_2>(([0-9]{1,3}(\\,[0-9]{1,3})*)*(\\.[0-9]{1,2})?)|[0-9\\,\\$\\s]*)?(\\s*)\\]?(?<other>[A-Za-z]+(\\s+[A-Za-z]+)*)?`   //\s*${words}\\s+\\[*\\s*(?<cards>[a-zA-Z0-9]{2}(\\,?\\s*[a-zA-Z0-9]{2})*)\\s*\\]*
  );
  const dealRegex = new RegExp(
    `\\bDealt\\b\\s+\\bto\\b\\s+(?<seat_name>${words})\\s+\\[*\\s*(?<cards>[a-zA-Z0-9]{2}(\\,?\\s*[a-zA-Z0-9]{2})*)\\s*\\]*`
  );

  let flopIndex = 0;
  let turnIndex = 0;
  let riverIndex = 0;
  for (let i = 0; i < records.length; i++) {
    const line = records[i];
    let result = flopRegex.exec(line)?.groups;
    
    if (result && result.description) {

      if (result.description === "Dealing Flop") {
        flop = result.cards_0.replace(/ /g, "").split(",");
        flopIndex = i;
      } else if (result.description === "FLOP") {
        flop = result.cards_0.split(" ");
        flopIndex = i;
      } else if (result.description === "Dealing Turn") {
        flop.push(result.cards_0);
        turnIndex = i;
      } else if (result.description === "TURN") {
        flop.push(result.cards_1);
        turnIndex = i;
      } else if (result.description === "Dealing River") {
        flop.push(result.cards_0);
        riverIndex = i;
      } else if (result.description === "RIVER") {
        flop.push(result.cards_1);
        riverIndex = i;
      }
    }
  }

  for (let i = 0; i < records.length; i++) {
    const line = records[i];
    let result = dealRegex.exec(line)?.groups;
    if (result) {
      if (mapPlayers[result.seat_name]) {
        mapPlayers[result.seat_name].cards = result.cards.split(/, | \s*/);
      }
    }
  }
  let bb = 0;
  let sb = 0;
  let ante = 0;
  let me: any;
  let lastAmount = {
    max: 0
  };
  let amount_remain = [];
  for (let i = 0; i < records.length; i++) {
    const line = records[i];
    let result = handRegex.exec(line)?.groups;
    if (result) {
      if (
        result.hand.trim() === "posts small blind" ||
        result.hand.trim() === "posts the small blind"
      ) {
        sb = parseInt(result.seat_amount.replace(/,/g, ""), 10);
      } else if (
        result.hand.trim() === "posts big blind" ||
        result.hand.trim() === "posts the big blind"
      ) {
        bb = parseInt(result.seat_amount.replace(/,/g, ""), 10);
      } else if (
        result.hand.trim() === "posts ante" ||
        result.hand.trim() === "posts the ante"
      ) {
        ante = parseInt(result.seat_amount.replace(/,/g, ""), 10);
      }
      if (mapPlayers[result.seat_name].cards.length > 0)
        me = mapPlayers[result.seat_name];
      if (
        result.hand.trim() === "posts ante" ||
        result.hand.trim() === "posts the ante" ||
        result.hand.trim() === "posts big blind" ||
        result.hand.trim() === "posts the big blind" ||
        result.hand.trim() === "posts small blind" ||
        result.hand.trim() === "posts the small blind" ||
        result.hand.trim() === "calls" ||
        result.hand.trim() === "raises" ||
        result.hand.trim() === "raises to" ||
        result.hand.trim() === "checks" ||
        result.hand.trim() === "folds" ||
        result.hand.trim() === "bets" ||
        result.hand.trim() === "is allIn"
      ) {
        
        if(result.hand.trim() === "bets") lastAmount = {max : 0}
        // if(result.hand.trim() === "raises" && reul)

        let player = parseInt(mapPlayers[result.seat_name].number);
        let totalChips = mapPlayers[result.seat_name].initAmount;
        let playerName = result.seat_name;
        if(lastAmount[player] == undefined)  lastAmount[player] = 0;
        if(amount_remain[player] == undefined) amount_remain[player]=totalChips;
        let action = result.hand.trim();
        let copyAction = result.hand.trim();
        let amount = result.seat_amount ? parseInt(result.seat_amount.replace(/,/g, ""), 10) : 0;
        if(result.other?.includes("allIn")) {
          result.hand === "raises";
          amount = amount_remain[player];
          action = "all-in";
          copyAction = "all-in";
        }
        if(result.seat_amount_2 && result.seat_amount_2!=' ') {
          amount = parseInt(result.seat_amount_2.replace(/,/g, ""), 10)
          result.hand = "raises to";
          action = "raises to";
          copyAction = "raises to"
          // amount = parseInt(result.seat_amount_2.replace(/,/g, ""), 10) - parseInt(result.seat_amount.replace(/,/g, ""), 10);
          // result.hand = "raises to";
        }
        // let amount = !!result.seat_amount  ? (!!result.seat_amount_2 && result.seat_amount_2!=' ') ? parseInt(result.seat_amount_2.replace(/,/g, ""), 10) - parseInt(result.seat_amount.replace(/,/g, ""), 10) : parseInt(result.seat_amount.replace(/,/g, ""), 10) : 0;

        // if(result.hand.trim() === "raises") {
        //   console.log('----------------in raises--------------', amount_remain[player])
        //   amount = amount_remain[player];
        // }
        if(result.other?.includes("allIn")) {
          action = "all-in";
          copyAction = "all-in"
        }
        if(result.hand.trim() === "raises to") {
          amount = amount - lastAmount[player];
        }
        let copyAmount = amount;
        // let displayAmount = (amount == 0 ) ? 0 : (result.hand.trim() == "calls" ? lastAmount.max : lastAmount[player] + amount);
        let displayAmount = (result.hand.trim() == "calls" ? lastAmount.max : lastAmount[player] + amount);
        
        // let displayAmount = (result.hand.trim() == "folds" || result.hand.trim() == "folds" ) ? 0 : (result.hand.trim() == "calls" ? lastAmount.max : lastAmount[player] + amount);
        
        let cards = mapPlayers[result.seat_name].cards;
        let tableAction = "";
        hands.push({
          player: player,
          totalChips: totalChips,
          playerName: playerName,
          action: action,
          copyAction: copyAction,
          amount: amount,
          copyAmount: copyAmount,
          displayAmount: (amount == 0 ) ? 0 : displayAmount,
          cards: cards,
          tableAction: tableAction,
        });
        lastAmount[player] = (result.hand.trim() === "posts ante" || result.hand.trim() === "posts the ante" ) ? 0 : displayAmount; 
        if(lastAmount.max < lastAmount[player]) lastAmount.max = lastAmount[player];
        amount_remain[player] = amount_remain[player] - hands[hands.length - 1].amount;
      }

      if (flopIndex > 0 && flopIndex - 1 === i) {
        hands.push({
          tableAction: "flop",
          amount: 0,
          copyAmount: 0,
          displayAmount: 0,
        });
        hands.push({
          tableAction: "flop",
          amount: 0,
          copyAmount: 0,
          displayAmount: 0,
        });
      } else if (turnIndex > 0 && turnIndex - 1 === i) {
        hands.push({
          tableAction: "turn",
          amount: 0,
          copyAmount: 0,
          displayAmount: 0,
        });
        hands.push({
          tableAction: "turn",
          amount: 0,
          copyAmount: 0,
          displayAmount: 0,
        });
      } else if (riverIndex > 0 && riverIndex - 1 === i) {
        hands.push({
          tableAction: "river",
          amount: 0,
          copyAmount: 0,
          displayAmount: 0,
        });
        hands.push({
          tableAction: "river",
          amount: 0,
          copyAmount: 0,
          displayAmount: 0,
        });
      }
    }
  }

  if (me) {
    hands.push({
      player: parseInt(me.number),
      totalChips: me.initAmount,
      playerName: me.seat_name,
      action: "?",
      copyAction: "?",
      amount: 0,
      copyAmount: 0,
      displayAmount: 0,
      cards: me.cards,
      tableAction: "",
    });
  }
  // console.log(hands);
  const dealerIndex = record.search("is the button");
  const dealer = parseInt(record[dealerIndex - 2]);
  const tableInfo = {
    dealer,
    sb,
    bb,
    ante,
    players: players.length,
    pot: 0,
  };

  return {
    tableInfo,
    players,
    hands,
    flop,
  };
};

export const compareValues = (key: string, order = "asc") => {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      return 0;
    }

    const varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
    const varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return order === "desc" ? comparison * -1 : comparison;
  };
};

export const calculateOrderAmount = (items: { id: string }[]) => {
  switch (items[0].id) {
    case String(process.env.PRODUCT_KEY):
      return 10000;
    default:
      return null;
  }
};

export const createDailyPwd = () => {
  const now = new Date();
  const key = process.env.SECRET_KEY;
  var algorithm = 'aes256';
  var cipher = crypto.createCipher(algorithm, key);  
  var encrypted = cipher.update(''+now.getTime(), 'utf8', 'hex') + cipher.final('hex');
  return encrypted;
}

export const chkDailyPwd = (password: string) => {

  const algorithm = 'aes256';
  const report_time = process.env.REPORT_TIME;
  const now = new Date();
  let today = new Date();
  today.setDate(now.getDate());
  today.setHours(parseInt(report_time.split("-")[0]))
  today.setMinutes(parseInt(report_time.split("-")[1]))
  today.setSeconds(0);
  let yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(parseInt(report_time.split("-")[0]))
  yesterday.setMinutes(parseInt(report_time.split("-")[1]))
  yesterday.setSeconds(0);
  let tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(parseInt(report_time.split("-")[0]))
  tomorrow.setMinutes(parseInt(report_time.split("-")[1]))
  tomorrow.setSeconds(0);
  const key = process.env.SECRET_KEY;
  var decipher = crypto.createDecipher(algorithm, key);
  try{
    var dateFromRequest = new Date(parseInt(decipher.update(password, 'hex', 'utf8') + decipher.final('utf8')));
  }
  catch(e) {
    return false;
  }
  if(dateFromRequest > today && dateFromRequest < tomorrow || dateFromRequest <= today &&  dateFromRequest >= yesterday) {
    return true;
  } else {
    return false;
  }
}