export const softDeletePlugin = (schema) => {

    schema.add({
        deleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
        deletedBy: { type: String, default: null }
    });

    const excludeDeleted = function () {
        if (!this.getOptions().withDeleted) {
            this.where({ deleted: { $ne: true } });
        }
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    schema.methods.softDelete = async function (deletedBy = null) {
        this.deleted = true;
        this.deletedAt = new Date();
        this.deletedBy = deletedBy;
        return this.save();
    };

    schema.methods.restore = async function () {
        this.deleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        return this.save();
    };

    schema.statics.softDeleteById = async function (id, deletedBy = null) {
        return this.findByIdAndUpdate(
            id,
            {
                deleted: true,
                deletedAt: new Date(),
                deletedBy
            },
            { new: true }
        ).setOptions({ withDeleted: true });
    };

    schema.statics.restoreById = async function (id) {
        return this.findByIdAndUpdate(
            id,
            {
                deleted: false,
                deletedAt: null,
                deletedBy: null
            },
            { new: true }
        ).setOptions({ withDeleted: true });
    };

    schema.statics.findWithDeleted = function (filter = {}) {
        return this.find(filter).setOptions({ withDeleted: true });
    };

    schema.statics.findDeleted = function (filter = {}) {
        return this.find({ ...filter, deleted: true }).setOptions({ withDeleted: true });
    };

    schema.statics.hardDelete = function (id) {
        return this.findByIdAndDelete(id).setOptions({ withDeleted: true });
    };
};