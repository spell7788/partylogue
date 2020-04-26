export default {
  methods: {
    copyText(text) {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.style.opacity = 0;
      tempTextArea.value = text;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();

      let copied = null;
      try {
        copied = document.execCommand('copy');
      } catch (err) {
        return null;
      } finally {
        document.body.removeChild(tempTextArea);
      }

      if (!copied) {
        return null;
      }

      return true;
    },
  },
};
