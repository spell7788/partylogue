<template>
  <tippy
    :to-element="$parent.$refs.msgInput"
    interactive
    placement="top-start"
    theme="light"
    trigger="manual"
    :visible="visible"
    distance="4"
  >
    <table
      v-if="autocomplete"
      :class="$style.autocomplete"
    >
      <tbody>
        <tr
          v-for="(item, i) in autocomplete.items"
          :key="item.value"
          :class="{
            [$style.item]: true,
            [$style.focused]: i === selectedItemIndex,
          }"
          @click="acceptAutocomplete(autocomplete.providerSymbol, item)"
        >
          <td :class="$style.value">
            {{ item.value }}
          </td>

          <td
            v-if="item.description"
            :class="$style.description"
          >
            {{ item.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </tippy>
</template>

<style lang="scss" module>
.autocomplete {
  border-spacing: 0;
  font-size: 1rem;
}

.item {
  cursor: pointer;

  & > * {
    padding: .35rem .5rem;
  }

  & > .value {
    background: $darker-light;
    font-weight: bold;
  }
}

.item:hover, .item:focus, .item.focused {
  & > .value {
    background: darken($lightpink, 5%);
  }

  & > .description {
    background: $lightpink;
  }
}

</style>

<script>
import debounce from 'lodash/debounce';
import { mapGetters, mapState } from 'vuex';
import { MentionProvider, CommandProvider } from '@/modules/autocompleteProviders';

const providersMap = {};
let autocompleteMatch;

export default {
  name: 'MessageInputAutocomplete',

  data() {
    return {
      autocomplete: null,
      visible: false,
      selectedItemIndex: null,
    };
  },

  computed: {
    ...mapState('user', ['user', 'commands']),
    ...mapGetters('user', ['msgInputCommands']),
    ...mapState('chatRoom', ['users', 'inputMsg']),
  },

  watch: {
    // eslint-disable-next-line func-names
    inputMsg: debounce(function (text) {
      const autocompleteRegex = this.constructAutocompleteRegex();
      const match = text.match(autocompleteRegex);
      if (!match) {
        this.visible = false;
        return;
      }
      autocompleteMatch = match;
      const [, providerSymbol, commandChars] = match;

      if (!Object.prototype.hasOwnProperty.call(providersMap, providerSymbol)) {
        this.visible = false;
        return;
      }

      const provider = providersMap[providerSymbol];
      const autocompleteItems = provider.getAutocompleteItems(commandChars);
      if (!autocompleteItems.length) {
        this.visible = false;
        return;
      }

      this.autocomplete = { providerSymbol, items: autocompleteItems };
      this.$nextTick(() => {
        this.visible = true;
      });
    }, 400, { leading: true }),

    visible() {
      this.selectedItemIndex = 0;
    },

    users(users) {
      const mentionProvider = new MentionProvider(users);
      providersMap[process.env.VUE_APP_MENTION_SYMBOL] = mentionProvider;
      console.debug('updated mention autocomplete provider: %O', mentionProvider);
    },

    msgInputCommands(commands) {
      if (commands.length === 0) return;
      const commandProvider = new CommandProvider(commands, false);
      providersMap[process.env.VUE_APP_COMMAND_SYMBOL] = commandProvider;
      console.debug('updated command autocomplete provider: %O', commandProvider);
    },
  },

  mounted() {
    const vm = this;
    const { msgInput } = this.$parent.$refs;
    msgInput.addEventListener('keydown', (ev) => {
      if (ev.isComposing || ev.keyCode === 229) return;

      if (vm.autocomplete && vm.visible) {
        let handled = false;
        if (
          ev.key === 'ArrowDown'
          && vm.selectedItemIndex < vm.autocomplete.items.length - 1
        ) {
          vm.selectedItemIndex += 1;
          handled = true;
        }

        if (ev.key === 'ArrowUp' && vm.selectedItemIndex > 0) {
          vm.selectedItemIndex -= 1;
          handled = true;
        }

        if (ev.key === 'Tab') {
          vm.acceptAutocomplete(
            vm.autocomplete.providerSymbol,
            vm.autocomplete.items[vm.selectedItemIndex],
          );
          handled = true;
        }

        if (handled) ev.preventDefault();
      }
    });
  },

  methods: {
    acceptAutocomplete(providerSymbol, item) {
      this.visible = false;
      // trim the full match if it has leading space
      // and add trailing space to autocomplete string to not trigger autocomplete again
      const [match] = autocompleteMatch;
      const msg = this.inputMsg.replace(match.trim(), `${providerSymbol}${item.value} `);
      this.$store.commit('chatRoom/setInputMessage', msg);
      this.autocomplete = null;
    },

    constructAutocompleteRegex() {
      const escapedProviderSymbols = Object
        .keys(providersMap)
        .map(symbol => `\\${symbol}`);
      return new RegExp(
        `(?:\\s|^)(${escapedProviderSymbols.join('|')})(\\w+)$`,
      );
    },
  },
};
</script>
