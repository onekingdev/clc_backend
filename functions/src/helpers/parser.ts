import axios from "axios";
require('dotenv').config();
let URL = require('url').URL;

export const vimeoDataExtractor = async (url: string) => {
    // https://vimeo.com/253989945
    // http://vimeo.com/api/v2/video/253989945.json
    let path = new URL(url).pathname.substr(1, new URL(url).pathname.length);

    path = path.split('/');

    return await axios.get(`http://vimeo.com/api/v2/video/${path.length === 2 ? path[1] : path[0]}.json`,{headers: {
            'Content-Type': 'application/json',
        }})
        .then((res: any) => {
            let data = {
                title: res.data[0].title,
                description: res.data[0].description,
                image: res.data[0].thumbnail_large ? res.data[0].thumbnail_large : '',
                duration: res.data[0].duration,
            }
            return data;
        })
        .catch(error => {
            return null;
            //console.log(error)
        })

}

export const parseHandHistory = (record: string) => {
    if (record === '') return {noHandHistory: true};
    const seatRegex = /Seat\s+[#?|\']?(?<seat_number>\d+)\'?:\s+(?<seat_name>[a-zA-Z0-9!@#\$%\^\&*\)\(+=._/\-\s\']*)\s+\(\s*(?<seat_amount>\S+(\s+\S+)*)\s*\)/;
    const seatAmountRegex = /(?<seat_amount>(\d{1,3}(\,\d{1,3})*)*(\.\d{1,2})?)/;
    const flopRegex = /\*+\s+(?<description>\w+(\s+\w+)*)\s+\*+\s+\[\s*(?<cards_0>[a-zA-Z0-9]{2}(\s*\,?\s*[a-zA-Z0-9]{2})*)\s*\](\s+\[\s*(?<cards_1>[a-zA-Z0-9]{2}(\s*\,?\s*[a-zA-Z0-9]{2})*)\s*\])?(\s+\[\s*(?<cards_2>[a-zA-Z0-9]{2}(\s*\,?\s*[a-zA-Z0-9]{2})*)\s*\])?/
    const records = record.split("\n");
    let players = [];
    let flop: string[] = [];
    let mapPlayers: { [key: string]: any} = {}
    let hands = [];
    for (let i = 0; i < records.length; i++) {
        const line = records[i];
        const result = seatRegex.exec(line)?.groups

        if (result) {
            const amountResult = seatAmountRegex.exec(result.seat_amount)?.groups;
            if (amountResult) {
                const player = {
                    number: result.seat_number,
                    name: result.seat_name,
                    initAmount: parseInt(amountResult.seat_amount.replace(/,/g, ''), 10),
                    cards: []
                }
                players.push(player);
                // @ts-ignore
                mapPlayers[player.name] =  player;
            }
        }

    }

    const words = players.map(p => `\\b${p.name.replace(" ", "\\s+")}\\b`).join("|")
    const handRegex = new RegExp(`(?<seat_name>${words})\\:?\\s+(?<hand>[A-Za-z]+(\\s+[A-Za-z]+)*)(\\s*)\\[?(\\s*)(?<seat_amount>(([0-9]{1,3}(\\,[0-9]{1,3})*)*(\\.[0-9]{1,2})?)|[a-zA-Z0-9\\,\\$\\s]*)?(\\s*)\\]?`)
    const dealRegex = new RegExp(`\\bDealt\\b\\s+\\bto\\b\\s+(?<seat_name>${words})\\s+\\[*\\s*(?<cards>[a-zA-Z0-9]{2}(\\,?\\s*[a-zA-Z0-9]{2})*)\\s*\\]*`)

    let flopIndex = 0;
    let turnIndex = 0;
    let riverIndex = 0;
    for (let i = 0; i < records.length; i++) {
        const line = records[i];
        let result = flopRegex.exec(line)?.groups

        if (result && result.description) {
            if (result.description === 'Dealing Flop') {
                flop = result.cards_0.replace(/ /g, '').split(',');
                flopIndex = i;
            } else if (result.description === 'FLOP') {
                flop = result.cards_0.split(' ');
                flopIndex = i;
            } else if (result.description === 'Dealing Turn') {
                flop.push(result.cards_0);
                turnIndex = i;
            } else if (result.description === 'TURN') {
                flop.push(result.cards_1);
                turnIndex = i;
            } else if (result.description === 'Dealing River') {
                flop.push(result.cards_0);
                riverIndex = i;
            } else if (result.description === 'RIVER') {
                flop.push(result.cards_1);
                riverIndex = i;
            }
        }

    }

    for (let i = 0; i < records.length; i++) {
        const line = records[i];
        let result = dealRegex.exec(line)?.groups

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
    for (let i = 0; i < records.length; i++) {
        const line = records[i];
        let result = handRegex.exec(line)?.groups;

        if (result) {
            if (result.hand.trim() === 'posts small blind' || result.hand.trim() === 'posts the small blind') {
                sb = parseInt(result.seat_amount.replace(/,/g, ''), 10)
            } else if (result.hand.trim() === 'posts big blind' || result.hand.trim() === 'posts the big blind') {
                bb = parseInt(result.seat_amount.replace(/,/g, ''), 10)
            } else if (result.hand.trim() === 'posts ante' || result.hand.trim() === 'posts the ante') {
                ante = parseInt(result.seat_amount.replace(/,/g, ''), 10)
            }
            if (mapPlayers[result.seat_name].cards.length > 0) me = mapPlayers[result.seat_name];
            
           
            if (result.hand.trim() === 'posts ante' || result.hand.trim() === 'posts the ante' || result.hand.trim() === 'posts big blind' || result.hand.trim() === 'posts the big blind' || result.hand.trim() === 'posts small blind' || result.hand.trim() === 'posts the small blind' || result.hand.trim() === 'calls' || result.hand.trim() === 'raises' || result.hand.trim() === 'checks' || result.hand.trim() === 'folds' || result.hand.trim() === 'bets' || result.hand.trim() === 'is allIn') {
                hands.push({
                    player: parseInt(mapPlayers[result.seat_name].number),
                    totalChips: mapPlayers[result.seat_name].initAmount,
                    playerName: result.seat_name,
                    action: result.hand.trim(),
                    copyAction: result.hand.trim(),
                    amount: result.seat_amount ? parseInt(result.seat_amount.replace(/,/g, ''), 10) : 0,
                    copyAmount: result.seat_amount ? parseInt(result.seat_amount.replace(/,/g, ''), 10) : 0,
                    cards: mapPlayers[result.seat_name].cards,
                    tableAction: ''
                });
            }
            if((flopIndex > 0 && flopIndex - 1 === i))
            {
                hands.push({
                    tableAction: 'flop',
                    amount:0,
                    copyAmount: 0,
                })
                hands.push({
                    tableAction: 'flop',
                    amount:0,
                    copyAmount: 0,
                })
            }
            else if((turnIndex > 0 && turnIndex - 1 === i ))
            {
                hands.push({
                    tableAction: 'turn',
                    amount: 0,
                    copyAmount: 0,
                })
                hands.push({
                    tableAction: 'turn',
                    amount: 0,
                    copyAmount: 0,
                })
            }
            else if(riverIndex > 0 && riverIndex - 1 === i)
            {
                hands.push({
                    tableAction: 'river',
                    amount: 0,
                    copyAmount: 0,
                })
                hands.push({
                    tableAction: 'river',
                    amount: 0,
                    copyAmount: 0,
                })
            }
       
        }
    }
   
    if (me) {
        hands.push({
            player: parseInt(me.number),
            totalChips: me.initAmount,
            playerName: me.seat_name,
            action: '?',
            copyAction: '?',
            amount: 0,
            copyAmount: 0,
            cards: me.cards,
            tableAction: ''
        });
    }

    const dealerIndex = record.search('is the button');
    const dealer = parseInt(record[dealerIndex-2])
    const tableInfo = {
        dealer,
        sb,
        bb,
        ante,
        players: players.length,
        pot: 0,
    }

    return ({
        tableInfo,
        players,
        hands,
        flop
    })
}

export const compareValues = (key: string, order = 'asc') => {
    return function innerSort(a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            return 0;
        }

        const varA = (typeof a[key] === 'string')
            ? a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string')
            ? b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order === 'desc') ? (comparison * -1) : comparison
        );
    };
}

export const calculateOrderAmount = (items: {id: string}[]) => {
    switch (items[0].id) {
        case String(process.env.PRODUCT_KEY):
            return 10000;
        default:
            return null;
    }
}