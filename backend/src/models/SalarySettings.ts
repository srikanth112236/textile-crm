import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkdaySchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface ISalarySettings extends Document {
  workingDaysPerMonth: number;
  mandatoryDailyHours: number;
  workdaySchedule: IWorkdaySchedule;
  monthlyPaidLeaves: number;
  yearlyPaidLeaves: number;
  baseSalaryPercentage: number;
  hraPercentage: number;
  daPercentage: number;
  specialAllowancePercentage: number;
  pfDeductionPercentage: number;
  esiPercentage: number;
  overtimeRatePerHour: number;
  shortHoursDeductionEnabled: boolean;
  updatedAt: Date;
}

const SalarySettingsSchema: Schema = new Schema(
  {
    workingDaysPerMonth: { type: Number, default: 26, min: 1, max: 31 },
    mandatoryDailyHours: { type: Number, default: 8, min: 1, max: 24 },
    workdaySchedule: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: false },
    },
    monthlyPaidLeaves: { type: Number, default: 2, min: 0 },
    yearlyPaidLeaves: { type: Number, default: 24, min: 0 },
    baseSalaryPercentage: { type: Number, default: 50, min: 0, max: 100 },
    hraPercentage: { type: Number, default: 20, min: 0, max: 100 },
    daPercentage: { type: Number, default: 15, min: 0, max: 100 },
    specialAllowancePercentage: { type: Number, default: 15, min: 0, max: 100 },
    pfDeductionPercentage: { type: Number, default: 12, min: 0, max: 100 },
    esiPercentage: { type: Number, default: 1.75, min: 0, max: 100 },
    overtimeRatePerHour: { type: Number, default: 250, min: 0 },
    shortHoursDeductionEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISalarySettings>('SalarySettings', SalarySettingsSchema);
