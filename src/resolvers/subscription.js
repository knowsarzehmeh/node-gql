const Subscription = {
  count: {
    subscribe: (parent, arg, { pubSub }, info) => {
      let count = 0;
      setInterval(() => {
        count += 1;
        pubSub.publish("count", {
          count,
        });
      }, 1000);

      return pubSub.subscribe("count");
    },
    resolve: (payload) => payload,
  },
};

export { Subscription as default };
