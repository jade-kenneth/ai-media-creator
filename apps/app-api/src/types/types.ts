export type NullableFilterCondition<T> = {
  equal: T;
  in: Array<T>;
  notIn: Array<T>;
  notEqual: T;
};
