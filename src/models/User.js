import mongoose from 'mongoose';
import { softDeletePlugin } from '../plugins/softDelete.plugin';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        name: {
            type: String,
            required: false,
            trim: true
        },

        lastName: {
            type: String,
            required: false,
            trim: true
        },

        nif: {
            type: String,
            required: false,
            trim: true
        },

        role: {
            type: String,
            enum: ['admin', 'guest'],
            default: 'admin'
        },

        status: {
            type: String,
            enum: ['pending', 'verified'],
            default: 'pending'
        },

        verificationCode: {
            type: String,
            match: [/^\d{6}$/, 'Debe tener 6 dígitos']
        },

        verificationAttempts: {
            type: Number,
            default: 3,
            min: 0,
            max: 3
        },

        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },

        address: {
            street: { type: String, trim: true },
            number: { type: String, trim: true },
            postal: { type: String, trim: true },
            city: { type: String, trim: true },
            province: { type: String, trim: true }
        },

        refreshToken: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true }
    }
);

userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

userSchema.virtual('fullName').get(function () {
    return `${this.name || ''} ${this.lastName || ''}`.trim();
});

userSchema.plugin(softDeletePlugin);

const User = mongoose.model('User', userSchema);

export default User;