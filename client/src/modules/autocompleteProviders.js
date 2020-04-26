class AutocompleteProvider {
  constructor(items, displayLimit = process.env.VUE_APP_AUTOCOMPLETE_DEFAULT_LIMIT) {
    this.items = items;
    this.displayLimit = displayLimit;
  }

  getAutocompleteItems(searchString) {
    const items = this.items.filter(this.isMatchingItemPredicate(searchString));
    return this.displayLimit ? items.slice(0, this.displayLimit) : items;
  }

  // eslint-disable-next-line class-methods-use-this
  isMatchingItemPredicate(searchString) {
    const searchRegex = new RegExp(searchString, 'i');
    return ({ value }) => searchRegex.test(value);
  }
}

export class MentionProvider extends AutocompleteProvider {
  constructor(users, ...args) {
    const items = users.map(user => ({ value: user.username }));
    super(items, ...args);
  }
}

export class CommandProvider extends AutocompleteProvider {
  static makeCommandDescription(commandArgs) {
    return commandArgs
      .filter(arg => arg.description)
      .map(arg => `[${arg.description}]`)
      .join(' ');
  }

  constructor(commands, ...args) {
    const items = commands
      .filter(({ visible }) => visible)
      .map(({ name, args: commandArgs }) => ({
        value: name,
        description: CommandProvider.makeCommandDescription(commandArgs),
      }));
    super(items, ...args);
  }

  getAutocompleteItems(searchString) {
    const isMatchingItem = this.isMatchingItemPredicate(searchString);
    return [...this.items].sort((item, other) => {
      const itemIsMatching = isMatchingItem(item);
      const otherIsMatching = isMatchingItem(other);
      if ((itemIsMatching && otherIsMatching)
        || (!itemIsMatching && !otherIsMatching)) return 0;
      if (itemIsMatching) return -1;
      return 1;
    });
  }
}

export default {
  MentionProvider,
  AutocompleteProvider,
};
