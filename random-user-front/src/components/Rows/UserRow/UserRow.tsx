import { UserRowProps } from "../UserRowProps";

const UserRow: React.FC<UserRowProps> = ({user}) => (
    <tr>
        <td>{user.name.first} {user.name.last}</td>
        <td>{user.gender}</td>
        <td>{user.email}</td>
    </tr>
);

export default UserRow;