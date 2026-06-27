import type { ImageSourcePropType } from 'react-native';

import { AnnouncementCategory } from '@/react-query/generated__types';

const emergencyIcon = require('../../../assets/announcement-emergency-icon.png');
const eventIcon = require('../../../assets/announcement-event-icon.png');
const generalNoticeIcon = require('../../../assets/announcement-general-notice-icon.png');
const healthAdvisoryIcon = require('../../../assets/announcement-health-advisory-icon.png');
const newsIcon = require('../../../assets/announcement-news-icon.png');
const powerInterruptionIcon = require('../../../assets/power-interruption-icon.png');
const roadClosureIcon = require('../../../assets/announcement-road-closure-icon.png');

export function getAnnouncementIconSource(
  category: AnnouncementCategory
): ImageSourcePropType {
  switch (category) {
    case AnnouncementCategory.Emergency:
      return emergencyIcon;
    case AnnouncementCategory.Event:
      return eventIcon;
    case AnnouncementCategory.GeneralNotice:
      return generalNoticeIcon;
    case AnnouncementCategory.HealthAdvisory:
      return healthAdvisoryIcon;
    case AnnouncementCategory.News:
      return newsIcon;
    case AnnouncementCategory.PowerInterruption:
      return powerInterruptionIcon;
    case AnnouncementCategory.RoadClosure:
      return roadClosureIcon;
    default:
      return generalNoticeIcon;
  }
}
