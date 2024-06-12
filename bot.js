/**const { Client, Intents } = require('discord.js');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, VoiceConnectionStatus } = require('@discordjs/voice');

// Set up Discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

// Read token and radio station URL from environment variables
const token = process.env.DISCORD_TOKEN;
const radioStationUrl = process.env.RADIO_STATION_URL;

// Function to start playing the radio station
async function startRadio(message) {
    try {
        const voiceChannel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        const resource = createAudioResource(radioStationUrl);
        player.play(resource);

        connection.subscribe(player);

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    connection.rejoin(),
                    connection.destroy(),
                ]);
            } catch (error) {
                console.error(error);
            }
        });

        console.log('The radio station is now playing!');
        await message.channel.send('The radio station is now playing!');
    } catch (error) {
        console.error(error);
        await message.channel.send('An error occurred while starting the radio station.');
    }
}

// Bot is ready event
client.once('ready', () => {
    console.log('Bot is online!');
});

// Bot message event
client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!playradio' && message.member.voice.channel) {
        await startRadio(message);
    }
});

// Log in to Discord
client.login(token);
**/


const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async message => {
    if (message.content === '!play' && message.member.voice.channel) {
        const connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(config.radioStationUrl);

        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('The radio station is now playing!');
        });

        player.on('error', error => {
            console.error(`Error: ${error.message}`);
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            player.stop();
        });

        message.reply('Playing radio station!');

        // Check if the bot is alone in the channel after a delay
        setTimeout(() => {
            if (connection && connection.joinConfig && connection.joinConfig.channel) {
                const membersInChannel = connection.joinConfig.channel.members.size;
                if (membersInChannel === 1) {
                    // If the bot is alone, destroy the connection
                    connection.destroy();
                    console.log('Bot left the channel because it was alone.');
                }
            } else {
                console.log('Connection or channel information is missing.');
            }
        }, 60000); // Adjust the delay as needed (e.g., 60000 milliseconds = 1 minute)

    } else if (message.content === '!stop') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('Stopped playing the radio station.');
        } else {
            message.reply('The bot is not connected to a voice channel.');
        }
    }
});

client.login(config.token);