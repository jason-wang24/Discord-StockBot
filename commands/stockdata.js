const { MessageEmbed } = require('discord.js');
const axios = require('axios').default;
const chartCmd = require('./chart');
require('dotenv').config();

let target = 1;

class sdCmd {
    constructor(request1, request2) {
        this.entity = request1; // either a ticker or 'search' command
        this.time = request2;
        this.name = request2;
    }
    
    init() {
        if (this.entity === 'SEARCH') {
            target = 2;
        } else {
            target = 1;
        }
        
        let stock = {
            method: 'GET',
            url: 'https://alpha-vantage.p.rapidapi.com/query',
            ...((target === 1) && {
                params: {
                    interval: `${this.time}min`,
                    function: 'TIME_SERIES_INTRADAY',
                    symbol: this.entity,
                    datatype: 'json',
                    output_size: 'compact'
                } }),
                
                ...((target === 2) && {
                    params: {keywords: `${this.name}`, function: 'SYMBOL_SEARCH', datatype: 'json'} }),
                    
                    headers: {
                        'x-rapidapi-host': 'alpha-vantage.p.rapidapi.com',
                        'x-rapidapi-key': process.env.API_KEY
                    }
                };
                return stock;
            }
            
            
            execute(message, stock) {
                axios.request(stock).then(response => {
                    if (target === 1) {
                        if (response.data.hasOwnProperty([ 'Error Message' ])) {
                            message.reply('Invalid ticker or time interval. Type !help for assistance.');
                        } else {
                            const metaData = response.data[ 'Meta Data' ];
                            const last = metaData[ '3. Last Refreshed' ];
                            const data = response.data[ `Time Series (${this.time}min)` ];
                            const singleData = data[last];
                            
                            const chart = new chartCmd();
                            
                            chart.execute(data, this.time, this.entity).then((image) => {
                                let finalStr = '';
                                for (let key in singleData) {
                                    if (singleData.hasOwnProperty(key)) {
                                        if (key === '5. volume') {
                                            finalStr += (`${key}` + ` ${singleData[key]}\n`);
                                        } else {
                                            finalStr += (`${key}` + ` ${parseFloat(singleData[key]).toFixed(2)}\n`);
                                        }
                                    }
                                }
                                
                                const dataEmbed = new MessageEmbed()
                                .setColor('#8fe166')
                                .setTitle(`${this.entity}`)
                                .setAuthor({ 
                                    name: 'Visit Yahoo Finance', 
                                    iconURL: 'https://s.yimg.com/cv/apiv2/myc/finance/Finance_icon_0919_250x252.png', 
                                    url: `https://finance.yahoo.com/quote/${this.entity}/` })
                                .setDescription(`Last Refresh: ${last.slice(0, -3)}` + ` ${metaData[ '6. Time Zone' ]} Time`)
                                .setThumbnail('https://i.imgur.com/AfFp7pu.png') //perhaps use image scraping??
                                .addFields(
                                    { name: `Most Recent Quote (${this.time} min)`, value: finalStr, inline: true },                                  
                                    { name: 'Inline field title', value: 'Some value here', inline: true },
                                    { name: 'Inline field title', value: 'Some value here', inline: false },
                                    )
                                    .addField('Inline field title', 'Some value here', true)
                                    .setImage(image)
                                    .setTimestamp()
                                    .setFooter({ text: 'Graphed using quickchart.js', iconURL: 'https://avatars.githubusercontent.com/u/10342521?s=200&v=4' });
                                    
                                    message.reply({ embeds: [dataEmbed] })});
                                }
                            } else if (target === 2) {
                                const matches = response.data.bestMatches;
                                if (matches.length === 0) {
                                    message.reply('Sorry! No Matches Found. Perhaps check your spelling?');
                                } else {
                                    const bestMatch = matches[0];
                                    let ticker = bestMatch[ '1. symbol' ];

                                    let finalStr = '';
                                    for (let key in bestMatch) {
                                        if (bestMatch.hasOwnProperty(key)) {
                                            if (key != '9. matchScore' && key != '2. name' && key != '3. type' && key != '1. symbol') {
                                                finalStr += (`${key}` + ` ${bestMatch[key]}\n`);
                                            }
                                        }
                                    }
                                    
                                    const searchEmbed = new MessageEmbed()
                                    .setColor('#0099ff')
                                    .setTitle(`${bestMatch[ '2. name' ]}`)
                                    .setAuthor({ 
                                        name: 'Visit Yahoo Finance', 
                                        iconURL: 'https://s.yimg.com/cv/apiv2/myc/finance/Finance_icon_0919_250x252.png', 
                                        url: `https://finance.yahoo.com/quote/${ticker}/` })
                                    .setDescription(`Ticker: ${ticker}` + `    Type: ${bestMatch[ '3. type' ]}`)
                                    .setThumbnail('https://i.imgur.com/AfFp7pu.png') //perhaps use image scraping??
                                    .addFields(
                                        { name: 'Other Information', value: finalStr, inline: true},
                                        { name: 'Inline field title', value: 'Some value here', inline: false },
                                        { name: 'Inline field title', value: 'Some value here', inline: true },)
                                        
                                        .addField('Inline field title', 'Some value here', true)
                                        .setImage('https://i.imgur.com/AfFp7pu.png')
                                        .setTimestamp()
                                        .setFooter({ text: 'Data from Alpha Vantage API', iconURL: 'https://miro.medium.com/max/1024/1*UCZCB7Vx3EJ9FN-pen4BqQ.png' });
                                        
                                        message.reply({ embeds: [searchEmbed] });
                                    }
                                }
                            }).catch(error => {
                                console.error(error);
                            });
                        }
                    }
                    
                    module.exports = sdCmd;