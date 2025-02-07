<template>
    <div
        class="overflow-y-scroll flex flex-col no-scrollbar shadow-lg min-w-[24rem] max-w-[24rem] bg-bg-light-tone dark:bg-bg-dark-tone">
        <!-- LEFT SIDE PANEL -->
        <div class="z-10 sticky top-0 flex-col  bg-bg-light-tone dark:bg-bg-dark-tone shadow-md">
            <!-- SEARCH BAR -->
            <form class="flex-row p-4  items-center gap-3 flex-0 w-full">
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <div class="scale-75">
                            <i data-feather="search"></i>
                        </div>
                    </div>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div class="hover:text-secondary duration-75 active:scale-90"
                            :class="filterTitle ? 'visible' : 'invisible'" title="Clear" @click="filterTitle = ''">
                            <i data-feather="x"></i>
                        </div>
                    </div>

                    <input type="search" id="default-search"
                        class="block w-full p-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg bg-bg-light focus:ring-secondary focus:border-secondary dark:bg-bg-dark dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-secondary dark:focus:border-secondary"
                        placeholder="Search..." title="Filter discussions by title" v-model="filterTitle"
                        @input="filterDiscussions()" />
                </div>
            </form>

            <!-- CONTROL PANEL -->
            <div class="flex-row p-4 pt-0 flex items-center gap-3 flex-0">

                <!-- MAIN BUTTONS -->
                <button class="text-2xl hover:text-secondary duration-75 active:scale-90" title="Create new discussion"
                    type="button" @click="createNewDiscussion()">
                    <i data-feather="plus"></i>
                </button>
                <button class="text-2xl hover:text-secondary duration-75 active:scale-90" title="Edit discussion list"
                    type="button" @click="isCheckbox = !isCheckbox" :class="isCheckbox ? 'text-secondary' : ''">
                    <i data-feather="check-square"></i>
                </button>
                <button class="text-2xl hover:text-secondary duration-75 active:scale-90"
                    title="Reset database, remove all discussions">
                    <i data-feather="refresh-ccw"></i>
                </button>
                <button class="text-2xl hover:text-secondary duration-75 active:scale-90" title="Export database"
                    type="button">
                    <i data-feather="database"></i>
                </button>

            </div>
            <hr v-if="isCheckbox" class="h-px bg-bg-light p-0 mb-4 px-4 mx-4 border-0 dark:bg-bg-dark">
            <div v-if="isCheckbox" class="flex flex-row flex-grow p-4 pt-0 items-center">

                <!-- CHECK BOX OPERATIONS -->
                <div class="flex flex-row flex-grow  gap-3">
                    Selected: {{ list.filter((item) => item.checkBoxValue == true).length }}
                </div>
                <div class="flex flex-row gap-3">


                    <button class="text-2xl hover:text-secondary duration-75 active:scale-90 " title="Select All"
                        type="button" @click.stop="selectAllDiscussions">
                        <i data-feather="list"></i>
                    </button>
                    <button class="text-2xl hover:text-secondary duration-75 active:scale-90 rotate-90"
                        title="Export selected to a file" type="button">
                        <i data-feather="log-out"></i>
                    </button>
                    <button class="text-2xl hover:text-red-600 duration-75 active:scale-90 " title="Remove selected"
                        type="button">
                        <i data-feather="trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="relative overflow-y-scroll no-scrollbar">
            <!-- DISCUSSION LIST -->
            <div class="mx-4 flex-grow" :class="filterInProgress ? 'opacity-20 pointer-events-none' : ''">
                <Discussion v-for="(item, index) in list" :key="index" :id="item.id" :title="item.title"
                    :selected="currentDiscussion.id == item.id" :loading="item.loading" :isCheckbox="isCheckbox"
                    :checkBoxValue="item.checkBoxValue" @select="selectDiscussion(item)" @delete="deleteDiscussion(item.id)"
                    @editTitle="editTitle" @checked="checkUncheckDiscussion" />

                <div v-if="list.length < 1"
                    class="gap-2 py-2 my-2 hover:shadow-md hover:bg-primary-light dark:hover:bg-primary rounded-md p-2 duration-75 group cursor-pointer">
                    <p class="px-3">No discussions are found</p>
                </div>
                <div
                    class="sticky bottom-0 bg-gradient-to-t pointer-events-none from-bg-light-tone dark:from-bg-dark-tone flex height-64">
                    <!-- FADING DISCUSSION LIST END ELEMENT -->
                </div>
            </div>
        </div>
    </div>
    <div class="overflow-y-scroll flex flex-col no-scrollbar flex-grow">
        <!-- :class="loading ? 'opacity-20 pointer-events-none' : ''"> -->
        <!-- CHAT AREA -->
        <div>
            <Message v-for="(msg, index) in discussionArr" :key="index" :message="msg"
                @click="scrollToElement($event.target)" :id="'msg-' + msg.id" />

            <WelcomeComponent v-if="discussionArr.length < 1" />

            <ChatBox v-if="discussionArr.length > 0" @messageSentEvent="sendMsg" :loading="isGenerating" />
        </div>
    </div>
</template>
<style scoped>
.height-64 {
    min-height: 64px;
}
</style>

<script>
export default {
    setup() { },
    data() {
        return {
            list: [], // Discussion list
            tempList: [], // Copy of Discussion list (used for keeping the original list during filtering discussions/searching action)
            currentDiscussion: {}, // Current/selected discussion id
            discussionArr: [],
            loading: false,
            filterTitle: '',
            filterInProgress: false,
            isCreated: false,
            isGenerating: false,
            isCheckbox: false,
            isSelectAll: false,

        }
    },
    methods: {
        async list_discussions() {
            try {
                const res = await axios.get('/list_discussions')

                if (res) {

                    this.createDiscussionList(res.data)
                    return res.data
                }
            } catch (error) {
                console.log(error)
                return []
            }
        },
        async load_discussion(id) {
            try {
                if (id) {
                    this.loading = true
                    this.setDiscussionLoading(id, this.loading)
                    const res = await axios.post('/load_discussion', {
                        id: id
                    })
                    this.loading = false
                    this.setDiscussionLoading(id, this.loading)
                    if (res) {
                        // Filter out the user and bot entries
                        this.discussionArr = res.data.filter((item) => item.type == 0)
                        const lastMessage = this.discussionArr[this.discussionArr.length - 1]
                        if (lastMessage) {
                            nextTick(() => {
                                const selectedElement = document.getElementById('msg-' + lastMessage.id)
                                this.scrollToElement(selectedElement)
                            })
                        }
                    }
                }
            } catch (error) {
                console.log(error)
                this.loading = false
                this.setDiscussionLoading(id, this.loading)
            }
        },
        async new_discussion(title) {
            try {
                const res = await axios.get('/new_discussion', { params: { title: title } })

                if (res) {
                    return res.data
                }
            } catch (error) {
                console.log(error)
                return {}
            }
        },
        async delete_discussion(id) {
            try {
                if (id) {
                    this.loading = true
                    this.setDiscussionLoading(id, this.loading)
                    const res = await axios.post('/delete_discussion', {
                        id: id
                    })
                    this.loading = false
                    this.setDiscussionLoading(id, this.loading)
                }
            } catch (error) {
                console.log(error)
                this.loading = false
                this.setDiscussionLoading(id, this.loading)
            }
        },
        async edit_title(id, new_title) {
            try {
                if (id) {
                    this.loading = true
                    this.setDiscussionLoading(id, this.loading)
                    const res = await axios.post('/edit_title', {
                        id: id,
                        title: new_title
                    })
                    this.loading = false
                    this.setDiscussionLoading(id, this.loading)
                    if (res.status == 200) {
                        const index = this.list.findIndex((x) => x.id == id)
                        const discussionItem = this.list[index]
                        discussionItem.title = new_title
                        this.tempList = this.list
                    }
                }
            } catch (error) {
                console.log(error)
                this.loading = false
                this.setDiscussionLoading(id, this.loading)
            }
        },
        filterDiscussions() {
            // Search bar in for filtering discussions by title (serch)

            if (!this.filterInProgress) {
                this.filterInProgress = true
                setTimeout(() => {
                    this.list = this.tempList.filter((item) => item.title && item.title.includes(this.filterTitle))
                    this.filterInProgress = false
                }, 100)
            }
        },
        async selectDiscussion(item) {
            // When discussion is selected it loads the discussion array

            this.currentDiscussion = item

            this.setPageTitle(item)

            localStorage.setItem('selected_discussion', this.currentDiscussion.id)

            await this.load_discussion(item.id)

            if (this.discussionArr.length > 1) {
                if (this.currentDiscussion.title === '' || this.currentDiscussion.title === null) {
                    this.changeTitleUsingUserMSG(this.currentDiscussion.id, this.discussionArr[1].content)
                }
            }
            nextTick(() => {
                const selectedDisElement = document.getElementById('dis-' + item.id)
                this.scrollToElement(selectedDisElement)
            })
        },
        scrollToElement(el) {
            //console.log("scroll", el.id)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
            }
        },
        createMsg(msgObj) {
            // From websocket.on("infos")
            // {
            //     "type": "input_message_infos",
            //     "bot": "gpt4all",
            //     "user": "user",
            //     "message": "giv emoney",
            //     "id": 112,
            //     "response_id": 113
            // }

            // Create user input message
            let usrMessage = {
                content: msgObj.message,
                id: msgObj.id,
                //parent: 10,
                rank: 0,
                sender: msgObj.user
                //type: 0
            }
            this.discussionArr.push(usrMessage)
            nextTick(() => {
                const userMsgElement = document.getElementById('msg-' + msgObj.message)
                this.scrollToElement(userMsgElement)
            })

            // Create response message
            let responseMessage = {
                content: '..typing',
                id: msgObj.response_id,
                //parent: 10,
                rank: 0,
                sender: msgObj.bot
                //type: 0
            }
            this.discussionArr.push(responseMessage)
            nextTick(() => {
                const responseMessageElement = document.getElementById('msg-' + msgObj.response_id)
                this.scrollToElement(responseMessageElement)
            })

            if (this.currentDiscussion.title === '' || this.currentDiscussion.title === null) {
                this.changeTitleUsingUserMSG(this.currentDiscussion.id, usrMessage.content)
            }

            this.isGenerating = false
            this.setDiscussionLoading(this.currentDiscussion.id, this.isGenerating)
        },
        sendMsg(msg) {
            // Sends message to backend
            this.isGenerating = true
            this.setDiscussionLoading(this.currentDiscussion.id, this.isGenerating)
            websocket.emit('generate_msg', { prompt: msg })
        },
        steamMessageContent(content) {
            // Streams response message content from backend

            const lastMsg = this.discussionArr[this.discussionArr.length - 1]
            lastMsg.content = content.data
        },
        async changeTitleUsingUserMSG(id, msg) {
            // If discussion is untitled or title is null then it sets the title to first user message.

            const index = this.list.findIndex((x) => x.id == id)
            const discussionItem = this.list[index]
            if (msg) {
                discussionItem.title = msg
                this.tempList = this.list
            }
            await this.edit_title(id, msg)
        },
        async createNewDiscussion() {
            // Creates new discussion on backend,
            // gets new discussion list, selects
            // newly created discussion,
            // scrolls to the discussion

            const res = await this.new_discussion()
            await this.list_discussions()
            const index = this.list.findIndex((x) => x.id == res.id)
            const discussionItem = this.list[index]
            this.selectDiscussion(discussionItem)
            nextTick(() => {
                const selectedDisElement = document.getElementById('dis-' + res.id)
                this.scrollToElement(selectedDisElement)
            })
        },
        loadLastUsedDiscussion() {
            // Checks local storage for last selected discussion
            const id = localStorage.getItem('selected_discussion')
            if (id) {
                const index = this.list.findIndex((x) => x.id == id)
                const discussionItem = this.list[index]
                if (discussionItem) {
                    this.selectDiscussion(discussionItem)
                }
            }
        },
        async deleteDiscussion(id) {
            // Deletes discussion from backend and frontend

            const index = this.list.findIndex((x) => x.id == id)
            const discussionItem = this.list[index]
            discussionItem.loading = true
            await this.delete_discussion(id)
            if (this.currentDiscussion.id == id) {
                this.currentDiscussion = {}
                this.discussionArr = []
                this.setPageTitle()
            }
            this.list.splice(this.list.findIndex(item => item.id == id), 1)

            this.createDiscussionList(this.list)
            //await this.list_discussions()
        },
        async editTitle(newTitleObj) {

            const index = this.list.findIndex((x) => x.id == newTitleObj.id)
            const discussionItem = this.list[index]
            discussionItem.title = newTitleObj.title
            discussionItem.loading = true
            await this.edit_title(newTitleObj.id, newTitleObj.title)
            discussionItem.loading = false
        },
        checkUncheckDiscussion(event, id) {
            // If checked = true and item is not in array then add item to list
            const index = this.list.findIndex((x) => x.id == id)
            const discussionItem = this.list[index]
            discussionItem.checkBoxValue = event.target.checked
            this.tempList = this.list
        },
        selectAllDiscussions() {

            // Check if there is one discussion not selected
            this.isSelectAll = !this.tempList.filter((item) => item.checkBoxValue == false).length > 0
            // Selects or deselects all discussions
            for (let i = 0; i < this.tempList.length; i++) {
                this.tempList[i].checkBoxValue = !this.isSelectAll
            }

            this.tempList = this.list
            this.isSelectAll = !this.isSelectAll
        },
        createDiscussionList(disList) {
            // This creates a discussion list for UI with additional properties
            if (disList) {
                const newDisList = disList.map((item) => {

                    const newItem = {
                        id: item.id,
                        title: item.title,
                        selected: false,
                        loading: false,
                        checkBoxValue: false
                    }
                    return newItem

                })
                this.list = newDisList
                this.tempList = newDisList

            }
        },
        setDiscussionLoading(id, loading) {
            const index = this.list.findIndex((x) => x.id == id)
            const discussionItem = this.list[index]
            discussionItem.loading = loading
        },
        setPageTitle(item) {
            // item is either title:String or {id:Number, title:String}
            if (item) {
                if (item.id) {
                    const realTitle = item.title ? item.title === "untitled" ? "New discussion" : item.title : "New discussion"
                    document.title = 'GPT4ALL - WEBUI - ' + realTitle
                } else {
                    const title = item || "Welcome"
                    document.title = 'GPT4ALL - WEBUI - ' + title
                }
            } else {
                const title = item || "Welcome"
                document.title = 'GPT4ALL - WEBUI - ' + title
            }


        }
    },
    async created() {
        // Constructor
        this.setPageTitle()
        await this.list_discussions()

        this.loadLastUsedDiscussion()
        this.isCreated = true

        nextTick(() => {
            feather.replace()
        })

        // WebSocket responses
        websocket.on('infos', this.createMsg)
        websocket.on('message', this.steamMessageContent)
    },
    activated() {
        // This lifecycle hook runs every time you switch from other page back to this page (vue-router)
        // To fix scrolling back to last message, this hook is needed.
        // If anyone knows hor to fix scroll issue when changing pages, please do fix it :D

        if (this.isCreated) {
            this.loadLastUsedDiscussion()
        }
    },
    components: {
        Discussion,
        Message,
        ChatBox,
        WelcomeComponent
    },
    watch: {
        filterTitle(newVal, oldVal) {
            if (newVal == '') {
                this.filterInProgress = true
                this.list = this.tempList
                this.filterInProgress = false
            }
        },
        isCheckbox(newval, oldval) {
            nextTick(() => {
                feather.replace()
            })
            if (!newval) {
                this.isSelectAll = false
            }
        },

    }
}
</script>

<script setup>
import Discussion from '../components/Discussion.vue'
import Message from '../components/Message.vue'
import ChatBox from '../components/ChatBox.vue'
import WelcomeComponent from '../components/WelcomeComponent.vue'

import feather from 'feather-icons'

import axios from 'axios'
import { nextTick } from 'vue'

import websocket from '@/services/websocket.js'

import { onMounted } from 'vue'
import { initFlowbite } from 'flowbite'

// initialize components based on data attribute selectors
onMounted(() => {
    initFlowbite()
})

axios.defaults.baseURL = import.meta.env.VITE_GPT4ALL_API_BASEURL
</script>
