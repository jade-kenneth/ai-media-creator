import React, { PropsWithChildren } from 'react';
import { Platform, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

const ViewWrapper = (props: PropsWithChildren<{ className?: string }>) => {
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  return (
    <View
      className={twMerge(
        'gap-6 px-5 py-6 ',
        isAndroid && 'pb-[120px]',
        isIOS && 'pb-[50px]',
        props.className,
      )}
    >
      {props.children}
    </View>
  );
};

export default ViewWrapper;
