<template>
  <div
    :id="id"
    :class="{
      [$style.message]: true,
      [$style.highlighted]: highlighted,
    }"
  >
    <div :class="$style.meta">
      <span :class="$style.timestamp">
        {{ formatDate(msg.date) }}
      </span>

      <img
        :src="roleBadge"
        :class="$style.badge"
        alt="user role"
      >

      <tippy
        v-if="isStaff && !noAvailableActions"
        interactive
        placement="bottom"
        theme="light"
        trigger="click"
        arrow
      >
        <template v-slot:trigger>
          <a :class="[$style.username, $style.actionsTrigger]">
            {{ msg.sender.username }}
          </a>
        </template>

        <Actions
          :msg="msg"
          :msg-removed="removed"
          :is-staff="isStaff"
          @noAvailableActions="noAvailableActions = true"
        />
      </tippy>
      <strong
        v-else
        :class="$style.username"
      >
        {{ msg.sender.username }}
      </strong>
    </div>

    <!-- eslint-disable vue/no-v-html -->
    <p
      v-if="!removed"
      :class="$style.text"
      v-html="evalMessage(msg.text)"
    />
    <p
      v-else
      :class="{
        [$style.text]: true,
        [$style.textRemoved]: removed,
      }"
    >
      message removed
    </p>
  </div>
</template>

<style lang="scss" module>
.message {
  width: fit-content;
  max-width: 70%;
  padding: 1rem;
  border-radius: 10px;
  transition: background 2s;

  @include mobile {
    max-width: 100%;
  }
}

.highlighted {
  background: $yellow !important;
}

.meta {
  @extend %flex-defaults;
  justify-content: flex-start;
  padding-bottom: .5rem;
  border-bottom: 1px dashed;
  @include children-gap(.4rem);
}

.timestamp {
  font-size: .8rem;
}

.badge {
  width: 15px;
  height: auto;
}

.username {
  font-size: 1.05rem;
  font-weight: bold;
  letter-spacing: .5px;
}

.actionsTrigger {
  @extend %link;
}

.text {
  margin: 1rem 0 0 0;
}

.mention {
  padding: .2rem .4rem;
  background: $dark;
  border-radius: 5px;
  color: $light;
}

.link {
  text-decoration: none;
  font-style: italic;
}

.imageLink {
  display: block;
  margin: .5rem 0;
}

.image {
  height: auto;
  max-width: 100%;
  border-radius: 10px;
}
</style>

<script>
import { mapState, mapGetters } from 'vuex';
import DOMPurify from 'dompurify';
// import urlRegex from 'url-regex';
import { dateFormatMixin, roleBadgeMixin } from '@/mixins';
import User from '@/modules/user';
import Mention from '@/modules/mention';
import { truncateCharsIfLonger } from '@/utils';
import Actions from './ChatRoomMessageActions.vue';

const DOMPurifyOptions = {
  ADD_ATTR: ['target'],
};

// eslint-disable-next-line max-len, no-useless-escape
const urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gmi;

export default {
  name: 'ChatRoomMessage',

  components: {
    Actions,
  },

  mixins: [
    dateFormatMixin,
    roleBadgeMixin,
  ],

  props: {
    roomId: {
      type: String,
      required: true,
    },

    msg: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      removed: false,
      highlighted: false,
      noAvailableActions: false,
    };
  },

  computed: {
    ...mapState('user', ['user']),
    ...mapGetters('user', ['userObj']),

    id() {
      return `msg${this.msg.id}`;
    },

    hash() {
      return `#${this.id}`;
    },

    // isHighlighted() {
    //   if (this.$route.hash !== this.hash) return false;
    //   setTimeout(() => {

    //   }, 4000);

    //   return true;
    // },

    isStaff() {
      if (!this.user) return false;
      return new User(this.user).isStaff(this.roomId);
    },

    mentionsMe() {
      if (!this.userObj) return false;
      return this.msg.text.includes(this.userObj.mentionString);
    },

    badgeRole() {
      return new User(this.msg.sender).getDominantRole(this.roomId);
    },
  },

  mounted() {
    if (this.$route.hash !== this.hash) return;
    setTimeout(() => {
      this.highlighted = false;
    }, 5000);
    this.highlighted = true;
  },

  methods: {
    evalMessage(initialMsg) {
      let msg = initialMsg;
      msg = this.evalMentions(msg);
      msg = this.evalMessageUrls(msg);
      msg = DOMPurify.sanitize(msg, DOMPurifyOptions);
      return msg;
    },

    evalMentions(msg) {
      if (!this.mentionsMe) return msg;
      return msg.replace(Mention.regex, (match) => {
        if (match === this.userObj.mentionString) {
          return `<span class="${this.$style.mention}">${match}</span>`;
        }

        return match;
      });
    },

    evalMessageUrls(msg) {
      let evaledImage = false;
      return msg.replace(urlRegex, (match) => {
        const url = match.startsWith('http://') || match.startsWith('https://')
          ? match : `http://${match}`;

        if (!evaledImage && (/\.(jpe?g|png|gif)$/i).test(match)) {
          evaledImage = true;
          return `
            <a target="_blank" href="${url}" class="${this.$style.imageLink}">
              <img src="${url}" class="${this.$style.image}">
            </a>
          `;
        }

        return `<a target="_blank" href="${url}" class="${this.$style.link}">${
          truncateCharsIfLonger(match, 20, '...')
        }</a>`;
      });
    },
  },

  sockets: {
    'message removed'(msgId) {
      if (msgId !== this.msg.id) return;
      this.removed = true;
    },
  },
};
</script>
